import { buildCompanyHeader } from '../builders/pdf-header.builder';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { PaymentPdfData } from '../interfaces/pdf-document.interfaces';
import { PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS, getPdfStyles } from '../styles/pdf-styles';

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const RECEIPT_LINE_WIDTH = 0.5;

function normalizeCurrencyCode(value: any): string {
  return String(value || '').trim().toUpperCase();
}

function getCurrencyConfig(data: PaymentPdfData, currencyCode: any): any {
  const code = normalizeCurrencyCode(currencyCode);
  if (!code || !Array.isArray(data.currencyList)) return null;

  return data.currencyList.find((currency: any) => {
    const currencyMasterCode = normalizeCurrencyCode(
      currency?.currencyCode ||
      currency?.CurrencyCode ||
      currency?.code
    );
    const status = String(currency?.status || currency?.Status || 'A').trim().toUpperCase();
    return currencyMasterCode === code && status === 'A';
  }) || null;
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

function formatCurrencyAmount(data: PaymentPdfData, value: any, currencyCode?: string): string {
  const currency = getCurrencyConfig(data, currencyCode || data.payment?.currencyCode || '');
  const decimals = getCurrencyAmountDecimals(currency);
  const groupingStyle = getCurrencyGroupingStyle(currency);
  const groupSeparator = getCurrencyGroupSeparator(currency);
  const rounded = Number(toNumber(value).toFixed(decimals));
  const [intPart, decPart] = Math.abs(rounded).toFixed(decimals).split('.');
  const grouped = groupIntegerPart(intPart, groupingStyle, groupSeparator);
  const body = decPart ? `${grouped}.${decPart}` : grouped;

  return `${rounded < 0 ? '-' : ''}${body}`;
}

function formatPaymentCurrencyAmount(data: PaymentPdfData, value: any): string {
  return formatCurrencyAmount(data, value, data.payment?.currencyCode || '');
}

function buildTitle(data: PaymentPdfData): any {
  const baseTitle = data.paymentType === 'bank' ? 'Bank Payment' : 'Cash Payment';

  return {
    text: `${baseTitle}${data.payment?.isDraft ? ' (DRAFT)' : ''}`,
    alignment: 'center',
    bold: true,
    fontSize: 12,
    margin: [0, 0, 0, 8]
  };
}

function infoRow(label: string, value: any, labelWidth = 58): any {
  return {
    columns: [
      { text: label, width: labelWidth, style: 'labelBold', noWrap: true },
      { text: ':', width: 5, style: 'labelBold', alignment: 'center' },
      { text: value ?? '', width: '*' }
    ],
    margin: [0, 0, 0, 4]
  };
}

function valueOnlyRow(value: any): any {
  return {
    columns: [
      { text: '', width: 58 },
      { text: '', width: 5 },
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
    if (p.partyAddress) {
      leftStack.push(valueOnlyRow(p.partyAddress));
    }

    rightStack.push(infoRow('Bank', p.bankName || '', 48));
    rightStack.push(infoRow('Bank Ref.', joinNonEmpty([p.instrumentMode, p.instrumentNumber, p.instrumentDate ? formatDate(p.instrumentDate) : ''], ' / '), 48));
    rightStack.push(infoRow('Currency', p.currencyCode || '', 48));
    rightStack.push(infoRow('Ex. Rate', formatNumberWithCommas(toNumber(p.exchangeRate), 3), 48));
  } else {
    leftStack.push(infoRow('Paid From', p.paidFrom || ''));
    leftStack.push(infoRow('Paid To', p.paidTo || ''));
    if (p.partyAddress) {
      leftStack.push(valueOnlyRow(p.partyAddress));
    }

    rightStack.push(infoRow('Payment Date', p.voucherDate ? formatDate(p.voucherDate) : ''));
    rightStack.push(infoRow('Currency', p.currencyCode || ''));
  }

  return {
    columns: [
      { width: 240, stack: leftStack },
      { width: 200, stack: rightStack }
    ],
    columnGap: 10,
    margin: [55, 0, 0, 4]
  };
}

function buildDetailsTable(data: PaymentPdfData): any {
  const header = [
    { text: 'Ledger', style: 'tableHeader', alignment: 'center', noWrap: true },
    { text: 'Description', style: 'tableHeader', alignment: 'center', noWrap: true },
    { text: 'Curr.', style: 'tableHeader', alignment: 'center', noWrap: true },
    { text: 'Ex.Rate', style: 'tableHeader', alignment: 'center', noWrap: true },
    { text: 'Amount', style: 'tableHeader', alignment: 'center', noWrap: true },
    { text: `${data.payment.currencyCode || ''} Amount`, style: 'tableHeader', alignment: 'center', noWrap: true }
  ];

  const rows: any[] = (data.details || []).map((item) => ([
    { text: item.ledgerName || '', style: 'tableCellSmall', margin: [2, 0, 0, 0] },
    { text: item.narration || '', style: 'tableCellSmall' ,margin: [2, 0, 0, 0] },
    { text: item.currencyCode || '', style: 'tableCellSmall', alignment: 'center' },
    { text: formatNumberWithCommas(toNumber(item.exchangeRate), 3), style: 'tableCellSmall', alignment: 'right', noWrap: true, margin: [0, 0, 2, 0] },
    { text: formatCurrencyAmount(data, item.amount, item.currencyCode), style: 'tableCellSmall', alignment: 'right', noWrap: true, fontSize: 8, margin: [0, 0, 2, 0] },
    { text: formatPaymentCurrencyAmount(data, item.partyAmount), style: 'tableCellSmall', alignment: 'right', noWrap: true, fontSize: 8, margin: [0, 0, 2, 0] }
  ]));

  rows.push([
    { text: '', style: 'tableCellSmall' , margin: [2, 0, 0, 0] },
    { text: '', style: 'tableCellSmall', margin: [2, 0, 0, 0] },
    { text: '', style: 'tableCellSmall', margin: [2, 0, 0, 0] },
    { text: '', style: 'tableCellSmall' , margin: [2, 0, 0, 0]},
    { text: 'Total', style: 'tableCellBoldSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatPaymentCurrencyAmount(data, data.totals.totalAmount), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true, fontSize: 8, margin: [0, 0, 2, 0] }
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ['20%', '*', '4%', '6%', '12%', '12%'],
      body: [header, ...rows]
    },
    layout: {
      ...PDF_TABLE_LAYOUTS.bordered,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 4,
      paddingBottom: () => 4,
      hLineWidth: () => 0.25,
      vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 0 : 0.25)
    },
    margin: [-10, 0, -10, 8]
  };
}

function buildAmountInWords(data: PaymentPdfData): any {
  return {
    columns: [
      { text: '', width: 0 },
      { text: 'Amount in Words', style: 'labelBold', width: 120, noWrap: true },
      { text: ':', width: 8 },
      { text: data.amountInWords || '', width: '*' }
    ],
    margin: [5, 0, 10, 8]
  };
}

function buildRemittanceSection(data: PaymentPdfData): any[] {
  const rows = data.voucherMatchings || [];
  if (!rows.length || data.payment?.postStatus !== 'P') return [];

  const header = [
    { text: 'Voucher No.', style: 'tableHeaderSmall', alignment: 'center', fontSize: 8 },
    { text: 'Bill No.', style: 'tableHeaderSmall', alignment: 'center', fontSize: 8 },
    { text: 'Bill Date', style: 'tableHeaderSmall', alignment: 'center', fontSize: 8 },
    { text: 'INV Type', style: 'tableHeaderSmall', alignment: 'center', fontSize: 8 },
    { text: 'Voucher Date', style: 'tableHeaderSmall', alignment: 'center', fontSize: 8 },
    { text: 'Curr.', style: 'tableHeaderSmall', alignment: 'center', fontSize: 8 },
    { text: 'Ex. Rate', style: 'tableHeaderSmall', alignment: 'center', fontSize: 8 },
    { text: 'Curr. Amt', style: 'tableHeaderSmall', alignment: 'center', fontSize: 8 },
    { text: 'Local Amount', style: 'tableHeaderSmall', alignment: 'center', fontSize: 8 }
  ];
  const widths: any[] = ['20%', '8%', '10%', '6%', '10%', '4%', '12%', '15%', '15%'];

  const bodyRows = rows.map((r) => ([
    { text: r.voucherNumber || '', style: 'tableCellSmall', noWrap: true, margin: [2, 0, 0, 0] },
    { text: r.BillNo || '', style: 'tableCellSmall', margin: [2, 0, 0, 0] },
    { text: r.BillDate ? formatDate(r.BillDate) : '', style: 'tableCellSmall', alignment: 'center' },
    { text: r.voucherType || '', style: 'tableCellSmall', alignment: 'center' },
    { text: r.voucherDate ? formatDate(r.voucherDate) : '', style: 'tableCellSmall', alignment: 'center' },
    { text: r.currencyCode || '', style: 'tableCellSmall', alignment: 'center' },
    { text: formatNumberWithCommas(toNumber(r.exchangeRate), 3), style: 'tableCellSmall', alignment: 'right', noWrap: true, margin: [0, 0, 2, 0] },
    { text: formatCurrencyAmount(data, r.matchingAmount, r.currencyCode), style: 'tableCellSmall', alignment: 'right', noWrap: true, margin: [0, 0, 2, 0] },
    { text: formatPaymentCurrencyAmount(data, r.matchingLocalAmount), style: 'tableCellSmall', alignment: 'right', noWrap: true, margin: [0, 0, 2, 0] }
  ]));

  const totalRow: any[] = [
    { text: '', style: 'tableCellSmall' },
    { text: '', style: 'tableCellSmall' },
    { text: '', style: 'tableCellSmall' },
    { text: '', style: 'tableCellSmall' },
    { text: '', style: 'tableCellSmall' },
    { text: '', style: 'tableCellSmall' },
    { text: 'Total', style: 'tableCellBoldSmall', alignment: 'right' },
    { text: formatPaymentCurrencyAmount(data, data.totals.totalMatchingAmount), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true, margin: [0, 0, 2, 0] },
    { text: formatPaymentCurrencyAmount(data, data.totals.totalMatchingLocalAmount), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true, margin: [0, 0, 2, 0] }
  ];

  return [
    { text: 'Remittance Details', style: 'sectionTitle', fontSize: 10, margin: [0, 4, 0, 4] },
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
        hLineWidth: () => 0.25,
        vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 0 : 0.25)
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

function buildReceiptContentDivider(): any {
  return {
    canvas: [
      { type: 'line', x1: -10, y1: 0, x2: 565, y2: 0, lineWidth: RECEIPT_LINE_WIDTH, lineColor: '#000000' }
    ],
    margin: [0, -2, 0, 8]
  };
}

export function generatePaymentDocument(data: PaymentPdfData): any {
  const configuredMargins = data.config?.pageMargins as number[] | undefined;
  const resolvedPageMargins = configuredMargins
    ? [
        configuredMargins[0] ?? 20,
        Math.max(configuredMargins[1] ?? 88, 88),
        configuredMargins[2] ?? 20,
        configuredMargins[3] ?? 55
      ]
    : [20, 88, 20, 55];

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: resolvedPageMargins,
    header: () => ({
      stack: [buildCompanyHeader(data)],
      margin: [10, 10, 10, 0]
    }),
    background: (_currentPage: number, pageSize: any) => ({
      canvas: [
        { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.25 },
        { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.25 },
        { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.25 },
        { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.25 }
      ]
    }),
    content: [
      buildReceiptContentDivider(),
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

function flattenLedgerList(ledgerList: any[]): any[] {
  return Array.isArray(ledgerList)
    ? ledgerList.flatMap((ledger: any) => Array.isArray(ledger) ? ledger : [ledger])
    : [];
}

function getSubledgerRecord(item: any, voucherDetails: any[], ledgerList: any[]): any {
  if (!item?.LedgerMasterSid) return null;

  const index = voucherDetails.findIndex((vd: any) => vd.VoucherDetailSid === item?.VoucherDetailSid);
  const indexedLedgers = index > -1 && Array.isArray(ledgerList?.[index]) ? ledgerList[index] : [];
  const allLedgers = flattenLedgerList(ledgerList);

  return [...indexedLedgers, ...allLedgers].find(
    (v: any) => Number(v?.SubledgerMasterSid) === Number(item?.LedgerMasterSid)
  ) || null;
}

function getSubledgerName(item: any, voucherDetails: any[], ledgerList: any[]): string {
  const directName = item?.SubledgerName || item?.subledgerMaster?.SubledgerName || item?.SubledgerMaster?.SubledgerName;
  if (directName) return directName;

  const ledger = getSubledgerRecord(item, voucherDetails, ledgerList);
  return ledger?.SubledgerName || ledger?.LedgerName || ledger?.CustomerName || '';
}

function getDisplayLedgerName(item: any, voucherDetails: any[], coaList: any[], ledgerList: any[]): string {
  const sub = getSubledgerName(item, voucherDetails, ledgerList);
  return sub || getLedgerName(item, coaList);
}

function getPaidToDisplay(
  apiData: any,
  paymentType: 'bank' | 'cash',
  voucherDetails: any[],
  coaList: any[],
  ledgerList: any[]
): string {
  const paidTo = String(apiData?.PartyName || apiData?.BankPartyName || '').trim();
  if (paidTo && !['NA', 'N/A', '-', 'NULL'].includes(paidTo.toUpperCase())) {
    return paidTo;
  }

  const detailRow = voucherDetails.find((item: any) =>
    item?.IsAutoGenerated !== 'Y' &&
    (paymentType === 'cash' || Number(item?.COAMasterSid) !== Number(apiData?.BankCOA))
  );

  if (detailRow) {
    return getDisplayLedgerName(detailRow, voucherDetails, coaList, ledgerList) || apiData?.BankPartyName || '';
  }

  return apiData?.BankPartyName || '';
}

function getHeaderDetailRow(apiData: any, voucherDetails: any[]): any {
  return voucherDetails.find(
    (item: any) =>
      item?.IsAutoGenerated !== 'Y' &&
      Number(item?.COAMasterSid) !== Number(apiData?.BankCOA)
  );
}

function getHeaderAddressDisplay(apiData: any, voucherDetails: any[], ledgerList: any[], headerSubledgerAddress?: string): string {
  const partyAddress = String(apiData?.PartyAddress || '').trim();
  if (partyAddress) return partyAddress;
  if (headerSubledgerAddress) return headerSubledgerAddress;

  const detailRow = getHeaderDetailRow(apiData, voucherDetails);
  const subledger = detailRow ? getSubledgerRecord(detailRow, voucherDetails, ledgerList) : null;
  return String(subledger?.Address || subledger?.BranchAddress || detailRow?.BranchAddress || detailRow?.Address || '').trim();
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
    currencyList?: any[];
    allowPrintBeforePosting?: boolean;
    headerSubledgerAddress?: string;
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
  const statusValues = [
    apiData?.PostStatus,
    apiData?.postStatus,
    apiData?.Status,
    apiData?.status
  ].map((value) => String(value || '').trim().toUpperCase());
  const isDraft = statusValues.some((value) =>
    value === 'U' ||
    value === 'UNPOSTED' ||
    value === 'UNPOST'
  ) && !options?.allowPrintBeforePosting;

  const detailRows = voucherDetails
    .filter(
      (item: any) =>
        item?.DrCr === 'D' &&
        item?.IsAutoGenerated !== 'Y' &&
        toNumber(item?.LocalAmount) !== 0
    )
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
      paidTo: getPaidToDisplay(apiData, paymentType, voucherDetails, coaList, ledgerList),
      partyAddress: getHeaderAddressDisplay(apiData, voucherDetails, ledgerList, options?.headerSubledgerAddress),
      paidFrom: getLedgerName({ COAMasterSid: apiData?.BankCOA }, coaList),
      currencyCode: apiData?.CurrencyCode || '',
      exchangeRate: toNumber(apiData?.ExchangeRate),
      bankName: bank?.LedgerName || '',
      instrumentMode: apiData?.InstrumentMode || '',
      instrumentNumber: apiData?.InstrumentNumber || '',
      instrumentDate: apiData?.InstrumentDate || '',
      postStatus: String(apiData?.PostStatus || ''),
      isDraft
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
      '',
    currencyList: options?.currencyList || []
  };
}
