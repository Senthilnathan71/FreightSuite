import { InvoicePdfData } from '../interfaces/pdf-document.interfaces';
import { PdfTermItem } from '../interfaces/pdf-base.interface';
import { buildCompanyHeader } from '../builders/pdf-header.builder';
import { buildSectionTitle } from '../builders/pdf-section.builder';
import { PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS, getPdfStyles } from '../styles/pdf-styles';
import { formatDate, formatNumberWithCommas } from '../helpers/pdf-formatters';

export function generateProformaInvoiceDocument(data: InvoicePdfData): any {
  const printData = (data as any).invoicePrintData || {};
  const isIndiaInvoice = !(data.taxDisplayConfig as any)?.showVAT;
  const topMargin = 166 + (isIndiaInvoice && printData.GSTCode ? 12 : 0);

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || [20, topMargin, 20, 42],
    background: (_currentPage: number, pageSize: any) => ({
      canvas: [
        { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.25 },
        { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.25 },
        { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.25 },
        { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.25 }
      ]
    }),
    header: () => ({
      stack: [
        buildHeader(data),
        buildTitle(data),
        buildBillingInfo(data)
      ],
      margin: [20, 10, 20, 0]
    }),
    content: [
      horizontalLine(0.1, [0, 0, 0, 4]),
      buildShipmentDetails(data),
      buildChargesTable(data),
      buildAmountInWords(data),
      buildLabeledText('Remarks', data.invoice?.remarks || ''),
      ...(printData.ContainerNumber || printData.ContainerType || data.invoice?.containerNumber
        ? [buildLabeledText('Container No / Type', formatContainerNumberType(printData, data.invoice?.containerNumber))]
        : []),
      ...buildBankDetails(data),
      ...buildTerms(data),
      buildSignatory(data)
    ],
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function buildHeader(data: InvoicePdfData): any {
  return {
    stack: [
      buildCompanyHeader(data),
      horizontalLine(0.1, [0, 0, 0, 0])
    ]
  };
}

function buildTitle(data: InvoicePdfData): any {
  const printData = (data as any).invoicePrintData || {};
  const isIndiaInvoice = !(data.taxDisplayConfig as any)?.showVAT;

  return {
    stack: [
      { text: data.invoiceTitle || printData.invoiceTitle || 'PROFORMA INVOICE', alignment: 'center', bold: true, fontSize: 14, margin: [0, 4, 0, 2] },
      ...(isIndiaInvoice && printData.GSTCode ? [{
        text: [{ text: 'GST Code : ', bold: true }, { text: printData.GSTCode }],
        alignment: 'center',
        fontSize: 9,
        margin: [0, 0, 0, 2]
      }] : [])
    ]
  };
}

function buildBillingInfo(data: InvoicePdfData): any {
  const invoice = data.invoice || {};
  const printData = (data as any).invoicePrintData || {};
  const isIndiaInvoice = !(data.taxDisplayConfig as any)?.showVAT;
  const billedToName =
    printData.BilledTo ||
    printData.CustomerName ||
    invoice.customerName ||
    (invoice as any).BilledTo ||
    (invoice as any).CustomerName ||
    '';
  const billedToAddress =
    printData.BillingAddress ||
    printData.CustomerAddress ||
    printData.CustomerAddress1 ||
    printData.Address ||
    printData.billingAddress ||
    printData.customerAddress ||
    printData.address ||
    printData.addressLine1 ||
    invoice.customerAddress ||
    (invoice as any).CustomerAddress1 ||
    (invoice as any).Address ||
    (invoice as any).billingAddress ||
    (invoice as any).BillingAddress ||
    (invoice as any).CustomerAddress ||
    (invoice as any).address ||
    (invoice as any).addressLine1 ||
    (data as any).BillingAddress ||
    (data as any).CustomerAddress ||
    (data as any).CustomerAddress1 ||
    (data as any).Address ||
    (data as any).billingAddress ||
    (data as any).customerAddress ||
    (data as any).address ||
    (data as any).addressLine1 ||
    findFirstAddressValue(data, [
      'BillingAddress',
      'CustomerAddress',
      'CustomerAddress1',
      'Address',
      'address',
      'addressLine1',
    ]) ||
    '';


  const leftStack: any[] = [
    { text: 'BILLED TO', style: 'labelBold', fontSize: 10, margin: [0, 0, 0, 3] },
    { text: billedToName, fontSize: 10, margin: [0, 0, 0, 3] },
    ...(billedToAddress ? [{ text: billedToAddress, fontSize: 10, margin: [0, 0, 0, 3] }] : []),
    ...(isIndiaInvoice ? [labelRow('PAN', printData.PAN || data.companyPan || '', 28)] : [])
  ];

  const rightStack = [
    labelRow(isIndiaInvoice ? 'GST No.' : 'VAT No.', printData.GST_VAT || invoice.customerGstVat || '', 78, [0, 0, 0, 0])
  ];

  return {
    stack: [
      {
        columns: [
          { width: '50%', stack: leftStack },
          { width: '50%', stack: rightStack }
        ],
        columnGap: 0,
        margin: [20, 8, 20, 10]
      },
    ],
    margin: [-10, 0, -10, 0]
  };
}

function buildShipmentDetails(data: InvoicePdfData): any {
  const invoice = data.invoice || {};
  const printData = (data as any).invoicePrintData || {};
  const isSeaMode = data.isSeaMode !== false;

  const leftItems = [
    ['Shipper', printData.ShipperName || invoice.shipperName],
    ['Consignee / Notify', printData.ConsigneeName || invoice.consigneeName],
    [isSeaMode ? 'Vessel Name' : 'Flight Name', printData.Vessel || invoice.vesselName],
    [isSeaMode ? 'Voyage No.' : 'Flight No.', printData.VoyageNo || invoice.voyageNo],
    ['Ref No.', printData.DocumentNumber || invoice.shipperRefNo],
    ['Loading Port', printData.POL || invoice.loadingPort || invoice.pol],
    ['Final Destination', printData.FPD || invoice.finalDestination || invoice.fpd]
  ];

  const rightItems = [
    ['ETD', printData.ETD ? formatDate(printData.ETD) : formatDate(invoice.etd)],
    ['ETA', printData.ETA ? formatDate(printData.ETA) : formatDate(invoice.eta)],
    ...(printData.IsServiceJob !== 'Y' && printData.JobType !== 'Agent' ? [[isSeaMode ? 'HBL' : 'HAWB', printData.HBLNo || invoice.hblNo]] : []),
    ...(printData.IsServiceJob !== 'Y' ? [[isSeaMode ? 'MBL' : 'MAWB', printData.MBLNo || invoice.mblNo]] : []),
    ['Job No.', printData.MasterJobNumber || invoice.jobNo],
    ['Freight Terms', printData.FreightTerms || invoice.freightTerms],
    ['Booking No.', printData.BookingNumber || invoice.bookingNo]
  ];

  const rightStack = rightItems.map(([label, value]) => labelRow(label, value || '', 70, [0, 2, 0, 2]));
  rightStack.push(buildCargoTable(data));

  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: leftItems.map(([label, value]) => labelRow(label, value || '', 88, [10, 2, 0, 3])), margin: [5, 2, 5, 2] },
        { stack: rightStack, margin: [5, 2, 5, 2] }
      ]]
    },
    layout: 'noBorders'
  };
}

function buildCargoTable(data: InvoicePdfData): any {
  const printData = (data as any).invoicePrintData || {};
  const cargo = data.cargoDetails || {};
  const isSeaMode = data.isSeaMode !== false;

  return {
    table: {
      headerRows: 1,
      widths: [30, '*', 55, 55],
      body: [
        [
          { text: 'Pkg', style: 'tableHeader', alignment: 'right' },
          { text: 'Commodity Desc', style: 'tableHeader', alignment: 'center' },
          { text: 'Gross Wt.', style: 'tableHeader', alignment: 'center' },
          { text: isSeaMode ? 'CBM' : 'Charge Wt.', style: 'tableHeader', alignment: 'center' }
        ],
        [
          { text: String(printData.pkg || cargo.packages || ''), alignment: 'center' },
          { text: printData.desc || cargo.commodityDesc || '' },
          { text: formatNumberWithCommas(printData.grosswt || cargo.grossWeight || 0, 3), alignment: 'right' },
          { text: formatNumberWithCommas(isSeaMode ? (printData.cbm || cargo.cbm || 0) : (printData.ChargeableWeight || cargo.chargeableWeight || 0), 3), alignment: 'right' }
        ]
      ]
    },
    layout: thinLineTableLayout(),
    margin: [0, 4, 0, 0]
  };
}

function buildChargesTable(data: InvoicePdfData): any {
  const printData = (data as any).invoicePrintData || {};
  const details = printData.voucherDetails || [];
  const taxConfig = (data.taxDisplayConfig as any) || {};

  const header: any[] = [
    tableHeader('S.No.'), tableHeader('Particulars'),
    tableHeader('Curr.'), tableHeader('No. of Unit'), tableHeader('Rate'), tableHeader('ROE')
  ];

  addTaxHeaders(header, taxConfig);
  header.push(tableHeader('Amt'), tableHeader('Local Amt'));

  const rows = details.map((detail: any, index: number) => {
    const row: any[] = [
      tableCell(detail.Sno || index + 1, 'center'),
      tableCell(softenLongTokens(detail.ChargeDescription || ''), 'left'),
      tableCell(detail.CurrencyCode || '', 'center'),
      tableCell(detail.NumberOfUnit || '', 'right'),
      tableCell(detail.Rate || '', 'right'),
      tableCell(detail.ExchangeRate || '', 'right')
    ];

    addTaxCells(row, detail, taxConfig);
    row.push(tableCell(detail.PartyAmount || '', 'right'));
    row.push(tableCell(detail.LocalAmount || '', 'right'));
    return row;
  });

  const localTotal = details.reduce((sum: number, detail: any) => sum + parseNumber(detail.LocalAmount), 0);
  const totalRow = buildTotalRow(header.length, localTotal);
  const body = details.length
    ? [header, ...rows, totalRow]
    : [header, noChargesCell(header.length), totalRow];

  return {
    table: {
      headerRows: 1,
      widths: buildChargeWidths(taxConfig),
      body
    },
    layout: thinLineTableLayout(),
    margin: [0, 0, 0, 2]
  };
}

function buildAmountInWords(data: InvoicePdfData): any {
  const printData = (data as any).invoicePrintData || {};
  const amount = printData.AmountInWords || data.amountInWords || '';
  const amountText = amount
    ? [{ text: amount }, { text: ' (VAT Not Included)', bold: true }]
    : '';
  return buildLabeledText('Amount In Words', amountText, 100);
}

function buildBankDetails(data: InvoicePdfData): any[] {
  const banks = data.bankDetails || [];
  if (!banks.length) return [];

  const rows: any[] = [
    [{ text: 'Details', style: 'tableHeader', alignment: 'center' }, ...banks.map((bank: any, index) => ({ text: `Bank (${bank.CurrencyCode || bank.currencyCode || data.invoice?.currencyCode || index + 1})`, style: 'tableHeader', alignment: 'center' }))],
    bankRow('Beneficiary Name', banks, 'BeneficiaryName', 'beneficiaryName'),
    bankRow('Account No.', banks, 'BankAccountNo', 'accountNo'),
    bankRow(data.isVATMode ? 'IBAN' : 'IFSC', banks, 'IFSCCode', 'ifscCode', 'iban'),
    bankRow('Swift Code', banks, 'BankCode', 'swiftCode'),
    bankRow('Bank Name', banks, 'BankName', 'bankName'),
    bankRow('Branch', banks, 'BankAddress', 'bankAddress', 'branchName')
  ];

  return [{
    stack: [
      buildSectionTitle('Bank Details', { margin: [0, 10, 0, 3] }),
      {
        table: { headerRows: 1, widths: [110, ...banks.map(() => '*')], body: rows, dontBreakRows: true },
        layout: thinLineTableLayout(),
        margin: [0, 0, 0, 5]
      }
    ],
    unbreakable: true
  }];
}

function buildTerms(data: InvoicePdfData): any[] {
  const companyMasterSid = Number((data.company as any)?.CompanyMasterSid || 0);
  const terms: PdfTermItem[] = companyMasterSid === 13
    ? [
        { content: 'If any discrepancy is noticed in the invoice, kindly inform us in writing within 7 days, otherwise the above amount will be considered as correct.' },
        { content: 'Please mention our invoice number(s) on your remittance instructions.' }
      ]
    : (data.terms || []).filter((term: any) => !!String(term?.content || '').trim());

  return terms.length ? [{
    stack: [
      { text: 'Terms and Conditions', style: 'sectionTitle', margin: [0, 10, 0, 5] },
      { ul: terms.map(term => term.content), margin: [0, 0, 0, 6] }
    ],
    margin: [0, 0, 0, 8]
  }] : [];
}

function buildSignatory(data: InvoicePdfData): any {
  return {
    stack: [
      { text: data.company?.companyName ? `For ${data.company.companyName}` : '', alignment: 'right', margin: [0, 0, 0, 2] },
      { text: 'Authorised Signatory', alignment: 'right', style: 'labelBold' }
    ]
  };
}

function buildFooter(data: InvoicePdfData, currentPage: number, pageCount: number): any {
  return {
    margin: [24, 22, 24, 0],
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, alignment: 'left', width: '25%', fontSize: 7, noWrap: true },
      { text: 'This document is computer-generated and does not require a signature.', alignment: 'center', width: '*', fontSize: 7, noWrap: true },
      { text: `Printed On : ${formatDate(new Date())}  Page: ${currentPage} of ${pageCount}`, alignment: 'right', width: '30%', fontSize: 7, noWrap: true }
    ]
  };
}

function labelRow(label: string, value: any, labelWidth = 88, margin: number[] = [0, 0, 0, 5]): any {
  return {
    columns: [
      { text: label, width: labelWidth, style: 'labelBold' },
      { text: ':', width: 6 },
      { text: value || '', width: '*' }
    ],
    margin
  };
}

function buildLabeledText(label: string, value: any, labelWidth = 100): any {
  return {
    margin: [0, 2, 0, 2],
    columns: [
      { width: labelWidth, text: label, style: 'labelBold' },
      { width: 6, text: ':' },
      { width: '*', text: value || '' }
    ]
  };
}

function formatContainerNumberType(printData: any, fallback = ''): string {
  const containerNumber = printData?.ContainerNumber || '';
  const containerType = printData?.ContainerType || '';
  if (containerNumber && containerType) return `${containerNumber} / ${containerType}`;
  return containerNumber || containerType || fallback || '';
}

function horizontalLine(lineWidth: number, margin: number[]): any {
  return {
    canvas: [{ type: 'line', x1: -10, y1: 0, x2: 565, y2: 0, lineWidth }],
    margin
  };
}

function thinLineTableLayout(): any {
  return {
    ...PDF_TABLE_LAYOUTS.bordered,
    hLineWidth: () => 0.1,
    vLineWidth: () => 0.1
  };
}

function tableHeader(text: string): any {
  return { text, style: 'tableHeaderSmall', alignment: 'center' };
}

function tableCell(text: any, alignment: 'left' | 'center' | 'right'): any {
  return { text: text ?? '', style: 'tableCellSmall', alignment, noWrap: alignment !== 'left' };
}

function buildChargeWidths(taxConfig: any = {}): (number | string)[] {
  const widths: (number | string)[] = [30, '*', 36, 62, 46, 50];
  if (taxConfig.showCGST) widths.push(38, 52);
  if (taxConfig.showSGST) widths.push(38, 52);
  if (taxConfig.showUGST) widths.push(38, 52);
  if (taxConfig.showIGST) widths.push(38, 52);
  widths.push(62, 72);
  return widths;
}

function buildTotalRow(colCount: number, total: any): any[] {
  const row: any[] = [];
  for (let i = 0; i < colCount - 2; i++) row.push({ text: '', style: 'tableCellSmall' });
  row.push({ text: 'Total', style: 'tableCellBoldSmall', bold: true, alignment: 'right', noWrap: true });
  row.push({ text: formatNumberWithCommas(parseNumber(total), 2), style: 'tableCellBoldSmall', bold: true, alignment: 'right', noWrap: true });
  return row;
}

function addTaxHeaders(header: any[], taxConfig: any): void {
  if (taxConfig.showCGST) header.push(tableHeader('CGST %'), tableHeader('CGST Amt.'));
  if (taxConfig.showSGST) header.push(tableHeader('SGST %'), tableHeader('SGST Amt.'));
  if (taxConfig.showUGST) header.push(tableHeader('UGST %'), tableHeader('UGST Amt.'));
  if (taxConfig.showIGST) header.push(tableHeader('IGST %'), tableHeader('IGST Amt.'));
}

function addTaxCells(row: any[], detail: any, taxConfig: any): void {
  if (taxConfig.showCGST) row.push(tableCell(detail.cgstRate || '', 'right'), tableCell(detail.cgstAmt || '', 'right'));
  if (taxConfig.showSGST) row.push(tableCell(detail.sgstRate || '', 'right'), tableCell(detail.sgstAmt || '', 'right'));
  if (taxConfig.showUGST) row.push(tableCell(detail.ugstRate || '', 'right'), tableCell(detail.ugstAmt || '', 'right'));
  if (taxConfig.showIGST) row.push(tableCell(detail.igstRate || '', 'right'), tableCell(detail.igstAmt || '', 'right'));
}

function noChargesCell(colSpan: number): any[] {
  return [
    { text: 'No charges available', style: 'tableCellSmall', alignment: 'center', colSpan },
    ...Array.from({ length: colSpan - 1 }, () => ({ text: '', style: 'tableCellSmall' }))
  ];
}

function bankRow(label: string, banks: any[], ...keys: string[]): any[] {
  return [
    { text: label, style: 'labelBold', fontSize: 8 },
    ...banks.map(bank => ({ text: firstValue(bank, keys), fontSize: 8 }))
  ];
}

function firstValue(source: any, keys: string[]): string {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && String(source[key]).trim() !== '') {
      return String(source[key]);
    }
  }
  return '';
}

function findFirstAddressValue(source: any, keys: string[], depth = 0): string {
  if (!source || typeof source !== 'object' || depth > 4) return '';

  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  for (const value of Object.values(source)) {
    if (value && typeof value === 'object') {
      const found = findFirstAddressValue(value, keys, depth + 1);
      if (found) return found;
    }
  }

  return '';
}

function parseNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  return Number(String(value).replace(/,/g, '')) || 0;
}

function softenLongTokens(value: any): string {
  return String(value || '')
    .replace(/,/g, ',\u200B')
    .replace(/\//g, '/\u200B')
    .replace(/-/g, '-\u200B')
    .replace(/([^\s\u200B]{14})(?=[^\s\u200B])/g, '$1\u200B');
}
