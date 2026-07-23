import { createFooterFunction } from '../builders/pdf-footer.builder';
import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { PaymentRequestPdfData } from '../interfaces/pdf-document.interfaces';
import { PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS, getPdfStyles } from '../styles/pdf-styles';

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildCompanyHeader(data: PaymentRequestPdfData): any {
  const company = data.company;
  const branch = data.branch;
  const logo = data.logo;
  const logoHeight = 68;
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
    { text: branch?.branchName || '', fontSize: 11, bold: true, alignment: printSettings.companyAlignment, margin: [0, 2, 0, 2] },
    { text: branch?.addressLine1 || company?.addressLine1 || '', fontSize: 9, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    {
      text: [
        { text: locationPrefix ? `${locationPrefix}${postalCode || phone ? ', ' : ''}` : '' },
        ...(postalCode ? [{ text: 'Postal Code : ', bold: true }, { text: `${postalCode}${phone ? ', ' : ''}` }] : []),
        ...(phone ? [{ text: 'Ph.no : ', bold: true }, { text: phone }] : [])
      ],
      fontSize: 8,
      alignment: printSettings.companyAlignment,
      margin: [0, 2, 0, 0],
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
      stack.push({
        image: logo,
        fit: [90, logoHeight],
        alignment: slotAlign[slot],
        margin: [8, 2, 12, 2]
      });
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
          hLineWidth: (i: number, node: any) => (i === node.table.body.length ? 0.25 : 0),
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

function buildTitle(): any {
  return {
    text: 'Payment Request',
    alignment: 'center',
    bold: true,
    fontSize: 12,
    margin: [0, 8, 0, 15]
  };
}

function infoRow(label: string, value: any, labelWidth: number): any {
  return {
    columns: [
      { text: label, width: labelWidth, style: 'labelBold' },
      { text: ':', width: 4, style: 'labelBold' },
      { text: value ?? '', width: '*' }
    ],
    margin: [0, 0, 0, 4]
  };
}

function buildInfoSection(data: PaymentRequestPdfData): any {
  const request = data.paymentRequest;

  return {
    columns: [
      {
        width: '*',
        stack: [
          infoRow('Request No.', request.requestNumber || '', 55),
          infoRow('Cash / Bank', request.cashBank || '', 54),
          infoRow('Party', request.partyName || '', 54),
          infoRow('Payable To', request.payableTo || '', 54),
          infoRow('Department', request.departmentName || '', 54)
        ]
      },
      {
        width: '*',
        stack: [
          infoRow('Request Date', request.requestDate ? formatDate(request.requestDate) : '', 73),
          infoRow('Currency', request.currencyCode || '', 73),
          infoRow('Status', request.status || '', 73),
          infoRow('Booking No.', request.bookingNo || '-', 73),
          infoRow('Job / House No.', request.jobOrHouseNo || '-', 73)
        ]
      }
    ],
    columnGap: 10,
    margin: [55, 0, 20, 8]
  };
}

function buildDetailsTable(data: PaymentRequestPdfData): any {
  const header = [
    { text: 'Charge', style: 'tableHeader', alignment: 'center' },
    { text: 'Unit', style: 'tableHeader', alignment: 'center' },
    { text: 'No. of Unit', style: 'tableHeader', alignment: 'center' },
    { text: 'Curr.', style: 'tableHeader', alignment: 'center' },
    { text: 'Ex.Rate', style: 'tableHeader', alignment: 'center' },
    { text: 'Per Unit', style: 'tableHeader', alignment: 'center' },
    { text: 'Amount', style: 'tableHeader', alignment: 'center' },
    { text: 'Local Amt', style: 'tableHeader', alignment: 'center' },
    { text: 'Party', style: 'tableHeader', alignment: 'center' }
  ];

  const rows = (data.details || []).map((item) => ([
    { text: item.chargeName || '', style: 'tableCellSmall', margin: [2, 0, 2, 0] },
    { text: item.unitName || '-', style: 'tableCellSmall', alignment: 'center' },
    { text: formatNumberWithCommas(toNumber(item.noOfUnit), 2), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: item.currencyCode || '', style: 'tableCellSmall', alignment: 'center' },
    { text: formatNumberWithCommas(toNumber(item.exchangeRate), 3), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(item.perUnit), 2), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(item.amount), 2), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(item.localAmount), 2), style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: item.partyName || '', style: 'tableCellSmall', margin: [2, 0, 2, 0] }
  ]));

  rows.push([
    { text: '', style: 'tableCellSmall', margin: [2, 0, 2, 0] },
    { text: '', style: 'tableCellSmall', alignment: 'center' },
    { text: '', style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: '', style: 'tableCellSmall', alignment: 'center' },
    { text: '', style: 'tableCellSmall', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: 'Total', style: 'tableCellBold', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(data.totals.totalAmount), 2), style: 'tableCellBold', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: formatNumberWithCommas(toNumber(data.totals.totalLocalAmount), 2), style: 'tableCellBold', alignment: 'right', margin: [0, 0, 2, 0] },
    { text: '', style: 'tableCellSmall', margin: [2, 0, 2, 0] }
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ['24%', '5%', '10%', '5%', '10%', '12%', '12%', '10%', '12%'],
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

function buildAmountInWords(data: PaymentRequestPdfData): any {
  return {
    columns: [
      { text: 'Amount in Words', style: 'labelBold', width: 98 },
      { text: ':', width: 8, style: 'labelBold' },
      { text: data.amountInWords || '', width: '*' }
    ],
    margin: [10, 0, 10, 12]
  };
}

function buildSignatureSection(): any {
  return {
    absolutePosition: { x: 30, y: 780 },
    columns: [
      { text: 'Checked By', bold: true, width: '*', margin: [15, 0, 0, 0] },
      { text: 'Approved By', bold: true, width: '*', alignment: 'right' }
    ],
    margin: [0, 0, 0, 0]
  };
}

export function generatePaymentRequestDocument(data: PaymentRequestPdfData): any {
  const configuredMargins = data.config?.pageMargins as number[] | undefined;
  const minimumTopMargin = data.logo ? 92 : 82;
  const resolvedPageMargins = configuredMargins
    ? [
        configuredMargins[0] ?? 20,
        Math.max(configuredMargins[1] ?? minimumTopMargin, minimumTopMargin),
        configuredMargins[2] ?? 20,
        configuredMargins[3] ?? 28
      ]
    : [20, minimumTopMargin, 20, 28];

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
        { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.25 },
        { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.25 },
        { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.25 },
        { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.25 }
      ]
    }),
    content: [
      buildTitle(),
      buildInfoSection(data),
      buildDetailsTable(data),
      buildAmountInWords(data),
      buildSignatureSection()
    ],
    footer: createFooterFunction(data.userData, { showPageNumbers: true, pageMargins: [30, 0, 30, 0] }),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

export function transformPaymentRequestApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  }
): PaymentRequestPdfData {
  const details = (apiData?.detailItems || []).map((item: any) => ({
    chargeName: item?.ChargeName || '',
    unitName: item?.UnitName || '-',
    noOfUnit: toNumber(item?.CostNumberOfUnit),
    currencyCode: item?.CurrencyCode || '',
    exchangeRate: toNumber(item?.CostExchangeRate),
    perUnit: toNumber(item?.CostRate),
    amount: toNumber(item?.CostAmount),
    localAmount: toNumber(item?.CostLocalAmount),
    partyName: item?.PartyName || ''
  }));

  return {
    company: {
      companyName: company?.companyName || company?.CompanyName || '',
      addressLine1: company?.addressLine1 || company?.Address || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.city || '',
      postalCode: company?.postalCode || '',
      phoneNumber: company?.phoneNumber || company?.Phone || '',
      countryMaster: company?.countryMaster,
      countryCode: company?.countryMaster?.countryCode || company?.countryCode || ''
    },
    branch: {
      branchName: branch?.branchName || branch?.BranchName || '',
      addressLine1: branch?.addressLine1 || branch?.Address || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || branch?.cityName || '',
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster,
      countryMaster: branch?.countryMaster,
      countryCode: branch?.countryMaster?.countryCode || branch?.countryCode || ''
    },
    userData: {
      userName: userData?.userName || userData?.UserName || '',
      email: userData?.email || userData?.Email || ''
    },
    logo,
    printSettings: options?.printSettings,
    paymentRequest: {
      requestNumber: apiData?.PaymentRequestNumber || '',
      requestDate: apiData?.PaymentRequestDate || '',
      cashBank: apiData?.CashBankLabel || apiData?.CashBank || '',
      currencyCode: apiData?.CurrencyCode || '',
      partyName: apiData?.PartyName || '',
      status: apiData?.PaymentRequestStatusLabel || apiData?.PaymentRequestStatus || '',
      payableTo: apiData?.PayableTo || '',
      bookingNo: apiData?.BookingNo || '-',
      departmentName: apiData?.DepartmentName || '',
      jobOrHouseNo: joinNonEmpty([apiData?.MasterJobNo || '-', apiData?.HouseNo], ' / '),
      remarks: apiData?.Remarks || ''
    },
    details,
    totals: {
      totalAmount: toNumber(apiData?.totalAmount),
      totalLocalAmount: toNumber(apiData?.totalLocalAmount)
    },
    amountInWords: apiData?.amountInWords || ''
  };
}
