import { InvoicePdfData } from '../interfaces/pdf-document.interfaces';
import { PdfTermItem } from '../interfaces/pdf-base.interface';
import { getPdfStyles, PDF_DEFAULT_CONFIG } from '../styles/pdf-styles';
import { formatDate, formatNumberWithCommas } from '../helpers/pdf-formatters';

const LOGO_HEIGHT_PT = 82.5;

export function generateNonJobInvoiceDocument(data: InvoicePdfData): any {
  const printData = (data as any).invoicePrintData || {};
  const taxConfig = (data.taxDisplayConfig as any) || {};
  const isIndiaInvoice = isIndiaPdfInvoice(data, taxConfig);
  const invoice: any = data.invoice || {};
  const printBillingAddress =
    printData.BillingAddress ||
    printData.billingAddress ||
    invoice.customerAddress ||
    '';
  const hasDueDate = !!(printData.InvoiceDueDate || invoice.invoiceDueDate || invoice.dueDate);
  const extraBillingAddressLines = getTextLineCount(printBillingAddress, 45);
  const extraTopMarginForBillingAddress = extraBillingAddressLines * (isIndiaInvoice ? 8 : 12);
  const topMargin = isIndiaInvoice
    ? 216 + (hasDueDate ? 6 : 0) + extraTopMarginForBillingAddress
    : 208 + (hasDueDate ? 8 : 0) + extraTopMarginForBillingAddress;

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: [20, topMargin, 20, 42],
    background: (_currentPage: number, pageSize: any) => ({
      canvas: [
        { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.5 },
        { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.5 },
        { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.5 },
        { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.5 }
      ]
    }),
    header: () => ({
      stack: [
        buildHeader(data, isIndiaInvoice),
        buildTitle(data),
        buildInvoiceInfo(data, isIndiaInvoice)
      ],
      margin: [20, 10, 20, 0]
    }),
    content: [
      buildChargesTable(data, taxConfig),
      buildAmountInWords(data),
      ...buildRemarks(data),
      ...buildBankDetails(data),
      ...buildTerms(data),
      ...buildSignatory(data)
    ],
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function buildHeader(data: InvoicePdfData, isIndiaInvoice: boolean): any {
  const company: any = data.company || {};
  const branch: any = data.branch || {};
  const companyName = company.companyName || (company as any).CompanyName || 'Company Name';
  const postalCode = branch.postalCode || (branch as any).ZipCode || company.postalCode || '';
  const phone = branch.phoneNumber || (branch as any).Phone || '';
  const branchName = String(branch.branchName || branch.BranchName || 'Company Branch').trim();
  const branchPlace = branchName;
  const addressLine = `${branch.addressLine1 || company.addressLine1 || ''}${branch.addressLine2 ? `, ${branch.addressLine2}` : ''}`;
  const branchPostalLine = `${branchPlace}${postalCode ? `, Postal Code : ${postalCode}` : ''}`;
  const companyTaxLabel = isIndiaInvoice ? 'GST No' : 'VAT No';
  const companyTaxValue = isIndiaInvoice
    ? ((branch as any).taxRegistrationNo || (branch as any).TaxRegistrationNo || (company as any).GST_VAT || '')
    : ((company as any).Pan || (company as any).PAN || '');

  return {
    stack: [
      {
        table: {
          widths: ['35%', '65%'],
          body: [[
            buildLogo(data.logo),
            {
              stack: [
                { text: companyName, alignment: 'right', bold: true, fontSize: 16, color: '#000', margin: [0, 0, 0, 7] },
                { text: addressLine, alignment: 'right', fontSize: 11, color: '#000', margin: [0, 0, 0, 6] },
                { text: branchPostalLine, alignment: 'right', fontSize: 11, color: '#000', margin: [0, 0, 0, 6] },
                { text: `Phone No : ${phone || ''}`, alignment: 'right', fontSize: 11, color: '#000', margin: [0, 0, 0, 6] },
                { text: `${companyTaxLabel} : ${companyTaxValue}`, alignment: 'right', fontSize: 11, color: '#000' }
              ],
              margin: [0, 0, 0, 0]
            }
          ]]
        },
        layout: 'noBorders',
        margin: [0, 8, 10, 8]
      },
      divider()
    ]
  };
}

function buildLogo(logo: string | null | undefined): any {
  if (!logo || logo === 'none') return { text: '', width: 1 };
  const fit: [number, number] = [105, LOGO_HEIGHT_PT];

  if (logo.startsWith('data:image/svg+xml')) {
    const payload = logo.split(',')[1] || '';
    const svg = logo.includes(';base64,') ? atob(payload) : decodeURIComponent(payload);
    return { svg, fit, alignment: 'left' };
  }

  return { image: logo, fit, alignment: 'left' };
}

function buildTitle(data: InvoicePdfData): any {
  const printData = (data as any).invoicePrintData || {};
  return {
    stack: [
      {
        text: printData.invoiceTitle || data.invoiceTitle || (data.invoice?.postStatus === 'P' ? 'TAX INVOICE' : 'TAX INVOICE DRAFT'),
        alignment: 'center',
        bold: true,
        fontSize: 13,
        margin: [0, 4, 0, 8]
      }
    ]
  };
}

function buildInvoiceInfo(data: InvoicePdfData, isIndiaInvoice: boolean): any {
  const invoice: any = data.invoice || {};
  const printData: any = (data as any).invoicePrintData || {};

  const dueDate =
    printData.InvoiceDueDate ||
    invoice.invoiceDueDate ||
    invoice.dueDate ||
    '';

  const customerTaxLabel = isIndiaInvoice ? 'GST No.' : 'VAT No.';

  const customerTaxNo =
    printData.GST_VAT ||
    printData.customerGstVat ||
    invoice.customerGstVat ||
    '';

  const billingAddress =
    printData.BillingAddress ||
    printData.billingAddress ||
    invoice.customerAddress ||
    '';

  const billedTo =
    printData.BilledTo ||
    invoice.customerName ||
    '';

  const irnNo =
    printData.IRNNumber ||
    printData.IRN_No ||
    invoice.irnNumber ||
    invoice.irnNo ||
    '';

  const leftStack: any[] = [
    {
      text: 'BILLED TO',
      bold: true,
      fontSize: 10,
      margin: [0, 0, 0, 5]
    },
    {
      text: billedTo,
      fontSize: 10,
      margin: [24, 0, 0, 4]
    },
    {
      text: billingAddress,
      fontSize: 10,
      margin: [24, 0, 0, 6],
      lineHeight: 1.25
    },
    {
      columns: [
        {
          width: 35,
          text: customerTaxLabel,
          bold: true,
          fontSize: 10,
          noWrap: true
        },
        {
          width: '*',
          text: `: ${customerTaxNo || ''}`,
          fontSize: 10,
          margin: [-2, 0, 0, 0]
        }
      ],
      margin: [0, 2, 0, 0]
    }
  ];

  const rightRows: any[] = [
    labelValue(
      'Invoice No.',
      printData.InvoiceNo || invoice.invoiceNo || '',
      80,
      10
    ),

    labelValue(
      'Invoice Date',
      formatDate(
        printData.InvoiceDate ||
        invoice.invoiceDate ||
        ''
      ),
      80,
      10
    )
  ];

  rightRows.push(
    labelValue(
      'Invoice Due Date',
      dueDate
        ? dueDate === 'Cash Invoice'
          ? dueDate
          : formatDate(dueDate)
        : '',
      80,
      10
    )
  );

  rightRows.push(
    labelValue(
      'Currency / Ex-Rate',
      printData.CurrExRate ||
      buildCurrencyExRate(invoice),
      80,
      10
    )
  );

  if (isIndiaInvoice) {
    rightRows.push(
      labelValue(
        'IRN No.',
        irnNo || '',
        80,
        10
      )
    );
  }

  return {
    stack: [
      {
        columns: [
          {
            width: '50%',
            stack: leftStack
          },
          {
            width: '50%',
            stack: rightRows,
            margin: [24, 0, 0, 0]
          }
        ],
        columnGap: 10,
        margin: [0, 0, 0, 10]
      },
      divider()
    ]
  };
}

function buildChargesTable(data: InvoicePdfData, taxConfig: any): any {
  const printData = (data as any).invoicePrintData || {};
  const companyCurrency = (data as any).currentCompanyCurrency?.code || data.localCurrency || data.totals?.currency || '';
  const invoiceCurrency = data.invoice?.currencyCode || data.totals?.currency || '';
  const showForeign = !!invoiceCurrency && !!companyCurrency && invoiceCurrency !== companyCurrency;
  const showHsnSac = getCompanyCountryCode(data) !== 'ae';

  const headers: any[] = [
    tableHeader('S.No.'),
    tableHeader('Narration'),
    ...(showHsnSac ? [tableHeader('HSN/SAC')] : []),
    tableHeader('Curr.'),
    tableHeader('No. of Unit'),
    tableHeader('Rate'),
    tableHeader('ROE'),
    tableHeader('Taxable Amt'),
    ...taxHeaders(taxConfig),
    tableHeader(`Amt In ${companyCurrency || invoiceCurrency}`),
    ...(showForeign ? [tableHeader(`Amt In ${invoiceCurrency}`)] : [])
  ];

  const rows = (printData.voucherDetails || data.charges || []).map((detail: any, index: number) => [
    cell(detail.Sno || detail.sno || index + 1, 'center'),
    narrationCell(detail.Narration || printData.Narration || printData.Remarks || detail.chargeName || ''),
    ...(showHsnSac ? [cell(detail.HSSACCode || detail.hsnSacCode || '')] : []),
    cell(detail.CurrencyCode || detail.currencyCode || ''),
    cell(detail.NumberOfUnit || detail.qty || '1.000', 'right'),
    amountCell(detail.Rate ?? detail.rate),
    amountCell(detail.ExchangeRate ?? detail.roe ?? detail.exchangeRate),
    amountCell(detail.TaxableAmount ?? detail.taxableAmount),
    ...taxCells(detail, taxConfig),
    amountCell(detail.LocalAmount ?? detail.localAmount),
    ...(showForeign ? [amountCell(detail.PartyAmount ?? detail.partyAmount)] : [])
  ]);

  const totalColspan = headers.length - 1;
  rows.push([
    { text: 'Total', bold: true, alignment: 'right', colSpan: totalColspan, border: [true, true, true, true] },
    ...Array(totalColspan - 1).fill({ text: '' }),
    { text: printData.totalPartyAmount || formatNumberWithCommas(data.totals?.grandTotal || 0), bold: true, alignment: 'right' }
  ]);

  const widths = buildChargeTableWidths(showHsnSac, taxConfig, showForeign);

  const chargesTable = {
    table: {
      headerRows: 1,
      widths,
      body: [headers, ...rows],
      dontBreakRows: true
    },
    layout: tableLayout(),
    fontSize: 8,
    margin: [-10, 8, -10, 8]
  };

  return {
    stack: [
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 0.5 }],
        margin: [-10, 2, -10, 2]
      },
      chargesTable
    ]
  };
}

function buildAmountInWords(data: InvoicePdfData): any {
  const printData = (data as any).invoicePrintData || {};
  return {
    columns: [
      { text: 'Amount In Words', width: 80, bold: true },
      { text: ':', width: 5 },
      { text: printData.AmountInWords || data.amountInWords || '', width: '*' }
    ],
    fontSize: 10,
    margin: [0, 0, 0, 8]
  };
}

function buildRemarks(data: InvoicePdfData): any[] {
  const printData = (data as any).invoicePrintData || {};
  const remarks = printData.Remarks || data.invoice?.remarks || '';
  return [{
    columns: [
      { text: 'Remarks', width: 80, bold: true },
      { text: ':', width: 8 },
      { text: remarks, width: '*' }
    ],
    fontSize: 9,
    margin: [0, 0, 0, 6]
  }];
}

function buildBankDetails(data: InvoicePdfData): any[] {
  const banks = data.bankDetails || [];
  if (!banks.length) return [];

  const headers = [
    tableHeader('Details'),
    ...banks.map((bank: any, index: number) => tableHeader(`Bank (${getBankCurrency(bank, data) || index + 1})`))
  ];

  const bankRows = [
    ['Beneficiary Name', 'BeneficiaryName', 'beneficiaryName', 'AccountName', 'accountName'],
    ['Account No.', 'BankAccountNo', 'accountNo'],
    [data.isVATMode !== false ? 'IBAN' : 'IFSC', 'IFSCCode', 'IBAN', 'iban', 'ifscCode'],
    ['Swift Code', 'BankCode', 'swiftCode'],
    ['Bank Name', 'BankName', 'bankName'],
    ['Branch', 'BankAddress', 'bankAddress', 'Address', 'address', 'BranchName', 'branchName']
  ];

  return [{
    stack: [
      { text: 'Bank Details', bold: true, fontSize: 10, margin: [0, 2, 0, 4] },
      {
        table: {
          headerRows: 1,
          widths: banks.length === 1 ? [135, 130] : [135, ...banks.map(() => '*')],
          body: [
            headers,
            ...bankRows.map(([label, ...keys]: string[]) => [
              { text: label, bold: true, fontSize: 8 },
              ...banks.map((bank: any) => ({ text: firstValue(bank, keys), fontSize: 8 }))
            ])
          ]
        },
        layout: tableLayout()
      }
    ],
    margin: [0, 0, 0, 8]
  }];
}

function buildTerms(data: InvoicePdfData): any[] {
  const companyMasterSid = Number((data.company as any)?.CompanyMasterSid || (data as any)?.companyMasterSid || 0);
  const terms: (PdfTermItem | string)[] = companyMasterSid === 13
    ? [
        'If any discrepancy is noticed in the invoice, kindly inform us in writing within 7 days, otherwise the above amount will be considered as correct.',
        'Please mention our invoice number(s) on your remittance instructions.'
      ]
    : (data.terms || []);
  const list = terms
    .map((term: any) => typeof term === 'string' ? term : term?.TandC || term?.Terms || term?.content || '')
    .filter((term: string) => !!String(term).trim());

  if (!list.length) return [];

  return [{
    stack: [
      { text: 'Terms and Conditions', bold: true, fontSize: 10, margin: [0, 4, 0, 4] },
      { ul: list, fontSize: 8 }
    ],
    margin: [0, 0, 0, 8]
  }];
}

function buildSignatory(data: InvoicePdfData): any[] {
  if (data.authorisedSignatory === false) return [];
  const companyName = data.company?.companyName || '';
  return [{
    stack: [
      { text: companyName ? `For ${companyName}` : '', alignment: 'right', margin: [0, 2, 0, 18] },
      { text: 'Authorised Signatory', alignment: 'right', bold: true }
    ]
  }];
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

function getCompanyCountryCode(data: InvoicePdfData): string {
  return String(
    (data as any).companyCountryCode ||
    data.branch?.countryCode ||
    data.company?.countryCode ||
    (data as any).invoicePrintData?.CustomerCountryCode ||
    ''
  ).toLowerCase();
}

function isIndiaPdfInvoice(data: InvoicePdfData, taxConfig: any): boolean {
  const companyCountry = getCompanyCountryCode(data).trim().replace(/[^a-z]/g, '');

  if (companyCountry) {
    return companyCountry === 'in' || companyCountry === 'india';
  }

  return !taxConfig.showVAT;
}

function buildCurrencyExRate(invoice: any): string {
  if (invoice?.currencyCode && invoice?.exchangeRate) return `${invoice.currencyCode} / ${invoice.exchangeRate}`;
  return invoice?.currencyCode || '';
}

function labelValue(label: string, value: any, labelWidth: number, fontSize?: number): any {
  return {
    columns: [
      { text: label, width: labelWidth, bold: true, noWrap: true },
      { text: ':', width: 3 },
      { text: value || '', width: '*', margin: [-2, 0, 0, 0] }
    ],
    fontSize,
    margin: [0, 0, 0, 4]
  };
}

function taxHeaders(config: any): any[] {
  return [
    ...(config.showCGST ? [tableHeader('CGST %'), tableHeader('CGST Amt.')] : []),
    ...(config.showSGST ? [tableHeader('SGST %'), tableHeader('SGST Amt.')] : []),
    ...(config.showUGST ? [tableHeader('UGST %'), tableHeader('UGST Amt.')] : []),
    ...(config.showIGST ? [tableHeader('IGST %'), tableHeader('IGST Amt.')] : []),
    ...(config.showVAT ? [tableHeader('VAT %'), tableHeader('VAT Amt.')] : [])
  ];
}

function taxCells(detail: any, config: any): any[] {
  return [
    ...(config.showCGST ? [amountCell(detail.cgstRate ?? detail.cgstPercent), amountCell(detail.cgstAmt ?? detail.cgstAmount)] : []),
    ...(config.showSGST ? [amountCell(detail.sgstRate ?? detail.sgstPercent), amountCell(detail.sgstAmt ?? detail.sgstAmount)] : []),
    ...(config.showUGST ? [amountCell(detail.ugstRate ?? detail.ugstPercent), amountCell(detail.ugstAmt ?? detail.ugstAmount)] : []),
    ...(config.showIGST ? [amountCell(detail.igstRate ?? detail.igstPercent), amountCell(detail.igstAmt ?? detail.igstAmount)] : []),
    ...(config.showVAT ? [amountCell(detail.vatRate ?? detail.vatPercent), amountCell(detail.vatAmt ?? detail.vatAmount)] : [])
  ];
}

function tableHeader(text: string): any {
  return { text, bold: true, alignment: 'center', fontSize: 7, noWrap: false };
}

function cell(text: any, alignment: 'left' | 'center' | 'right' = 'left'): any {
  return { text: text ?? '', alignment, fontSize: 7 };
}

function narrationCell(text: any): any {
  return {
    text: softenLongTokens(text),
    alignment: 'left',
    fontSize: 7,
    noWrap: false,
    lineHeight: 1.1
  };
}

function softenLongTokens(text: any): string {
  return String(text ?? '').replace(/(\S{22})(?=\S)/g, '$1 ');
}

function amountCell(value: any): any {
  const text = value === null || value === undefined || value === '' ? '' : formatNumberWithCommas(Number(value) || 0);
  return cell(text, 'right');
}

function tableLayout(): any {
  return {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingLeft: () => 2,
    paddingRight: () => 2,
    paddingTop: () => 3,
    paddingBottom: () => 3
  };
}

function buildChargeTableWidths(showHsnSac: boolean, taxConfig: any, showForeign: boolean): (number | string)[] {
  const taxColumnCount = taxHeaders(taxConfig).length;
  const compact = taxColumnCount > 4 || showForeign;
  const veryCompact = taxColumnCount > 6;

  if (showHsnSac && showForeign && taxColumnCount >= 4) {
    return [
      20,
      '*',
      32,
      24,
      34,
      28,
      30,
      40,
      ...buildTaxColumnWidths(taxColumnCount, true),
      42,
      42
    ];
  }

  if (showHsnSac && !showForeign && taxColumnCount >= 4) {
    return [
      20,
      '*',
      38,
      24,
      34,
      30,
      30,
      42,
      ...buildTaxColumnWidths(taxColumnCount, true),
      46
    ];
  }

  return [
    veryCompact ? 20 : 24,
    '*',
    ...(showHsnSac ? [veryCompact ? 30 : compact ? 38 : 44] : []),
    veryCompact ? 24 : 28,
    veryCompact ? 32 : compact ? 38 : 44,
    veryCompact ? 28 : compact ? 32 : 36,
    veryCompact ? 28 : compact ? 34 : 38,
    veryCompact ? 38 : compact ? 44 : 48,
    ...buildTaxColumnWidths(taxColumnCount),
    veryCompact ? 38 : compact ? 46 : 54,
    ...(showForeign ? [veryCompact ? 38 : 46] : [])
  ];
}

function buildTaxColumnWidths(taxColumnCount: number, forceCompact = false): number[] {
  if (forceCompact) {
    return Array(taxColumnCount).fill(0).map((_, index) => index % 2 === 0 ? 26 : 32);
  }

  if (taxColumnCount <= 2) {
    return Array(taxColumnCount).fill(0).map((_, index) => index % 2 === 0 ? 38 : 50);
  }

  if (taxColumnCount <= 4) {
    return Array(taxColumnCount).fill(0).map((_, index) => index % 2 === 0 ? 34 : 42);
  }

  if (taxColumnCount <= 6) {
    return Array(taxColumnCount).fill(0).map((_, index) => index % 2 === 0 ? 28 : 34);
  }

  return Array(taxColumnCount).fill(22);
}

function divider(): any {
  return {
    canvas: [{ type: 'line', x1: -10, y1: 0, x2: 565, y2: 0, lineWidth: 0.5 }],
    margin: [0, 0, 0, 6]
  };
}

function getTextLineCount(text: any, charactersPerLine: number): number {
  const value = String(text || '').trim();
  if (!value) return 0;

  return value
    .split(/\r?\n/)
    .reduce((lineCount, line) => lineCount + Math.max(0, Math.ceil(line.length / charactersPerLine) - 1), 0);
}

function firstValue(source: any, keys: string[]): string {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
}

function getBankCurrency(bank: any, data: InvoicePdfData): string {
  return firstValue(bank, ['CurrencyCode', 'currencyCode', 'bankCurrencyCode']) ||
    data.invoice?.currencyCode ||
    data.localCurrency ||
    '';
}
