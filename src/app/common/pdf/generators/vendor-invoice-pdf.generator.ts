 
 
 /**
   * Invoice PDF Generator - COMPLETE CORRECTED VERSION
   * Generates Invoice PDFs matching HTML template exactly
   * Uses vendorInvoiceData for all display content
   */

  import { VendorInvoicePdfData, InvoiceChargeData, InvoiceBankDetail } from '../interfaces/pdf-document.interfaces';
  import { PdfTermItem } from '../interfaces/pdf-base.interface';
  import { createFooterFunction } from '../builders/pdf-footer.builder';
  import { buildTwoColumnInfo } from '../builders/pdf-table.builder';
  import {
    buildTitle,
    buildSectionTitle,
    buildDivider,
    
  } from '../builders/pdf-section.builder';
  import { getPdfStyles, PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS } from '../styles/pdf-styles';
  import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
  import { Bold } from 'angular-feather/icons';

  // HTML print logo uses 110px. pdfMake works in pt, so convert px -> pt (72/96).
  const INVOICE_LOGO_HEIGHT_PX = 110;
  const INVOICE_LOGO_HEIGHT_PT = INVOICE_LOGO_HEIGHT_PX * 0.75;

  function isIndianCompany(data: VendorInvoicePdfData): boolean {
    const branchCountryCode = String(data.branch?.countryCode || '').trim().toLowerCase();
    const companyCountryCode = String(data.company?.countryCode || '').trim().toLowerCase();
    const gstCode = String(data.companyGstCode || '').trim();
    const usesIndiaGst =
      !!data.taxDisplayConfig?.showCGST ||
      !!data.taxDisplayConfig?.showSGST ||
      !!data.taxDisplayConfig?.showIGST;

    return (
      branchCountryCode === 'in' ||
      companyCountryCode === 'in' ||
      usesIndiaGst ||
      gstCode.length >= 15
    );
  }

  function isUaeCompany(data: VendorInvoicePdfData): boolean {
    const branchCountryCode = String(data.branch?.countryCode || '').trim().toLowerCase();
    const companyCountryCode = String(data.company?.countryCode || '').trim().toLowerCase();
    const placeOfSupply = String(data.invoice?.placeOfSupply || '').trim().toLowerCase();

    return (
      branchCountryCode === 'ae' ||
      companyCountryCode === 'ae' ||
      placeOfSupply === 'dubai' ||
      placeOfSupply === 'uae' ||
      placeOfSupply === 'united arab emirates'
    );
  }

  function estimateWrappedLineCount(text: string, charsPerLine: number): number {
    if (!text) {
      return 0;
    }

    return text
      .split(/\r?\n/)
      .reduce((count, line) => count + Math.max(1, Math.ceil((line || '').length / charsPerLine)), 0);
  }

  function normalizeCurrencyCode(value: any): string {
    return String(value || '').trim().toUpperCase();
  }

  function getCurrencyMaster(data: VendorInvoicePdfData): any[] {
    return Array.isArray((data as any).currencyMaster) ? (data as any).currencyMaster : [];
  }

  function findCurrencyBySid(data: VendorInvoicePdfData, currencySid: any): any {
    const sid = Number(currencySid);
    if (!Number.isFinite(sid) || !sid) return null;

    return getCurrencyMaster(data).find((currency: any) =>
      Number(currency?.CurrencyMasterSid || currency?.currencyMasterSid || 0) === sid
    ) || null;
  }

  function findCurrencyByCode(data: VendorInvoicePdfData, currencyCode: any): any {
    const code = normalizeCurrencyCode(currencyCode);
    if (!code) return null;

    return getCurrencyMaster(data).find((currency: any) => {
      const masterCode = normalizeCurrencyCode(currency?.currencyCode || currency?.CurrencyCode || currency?.code);
      return masterCode === code;
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

  function getCompanyCurrency(data: VendorInvoicePdfData): any {
    return findCurrencyBySid(data, (data.company as any)?.CurrencyMasterSid) ||
      findCurrencyByCode(data, data.localCurrency);
  }

  function getVendorInvoiceCurrency(data: VendorInvoicePdfData): any {
    return findCurrencyBySid(
      data,
      (data as any).vendorInvoiceData?.CurrencyMasterSid ||
      (data as any).invoicePrintData?.CurrencyMasterSid ||
      (data.invoice as any)?.CurrencyMasterSid
    ) || findCurrencyByCode(data, data.invoice?.currencyCode || data.totals?.currency);
  }

  function formatCompanyCurrencyAmount(data: VendorInvoicePdfData, value: any): string {
    return formatCurrencyAmount(value, getCompanyCurrency(data));
  }

  function formatVendorInvoiceCurrencyAmount(data: VendorInvoicePdfData, value: any): string {
    return formatCurrencyAmount(value, getVendorInvoiceCurrency(data));
  }

  /**
   * Generate invoice PDF document definition
   */
  export function generateVendorInvoiceDocument(data: VendorInvoicePdfData): any {
    console.log(data, 'generateVendorInvoiceDocument');
    const chargesCount = data.charges?.length || 0;
    const shouldBreakPageForTerms = chargesCount > 20;
    const isIndiaCompany = isIndianCompany(data);
    const printData = (data as any).vendorInvoiceData || (data as any).invoicePrintData;
    const logoHeaderHeight = INVOICE_LOGO_HEIGHT_PT;
    const baseTopMargin = 128;
    const extraTopMarginForLogo = Math.max(0, logoHeaderHeight - 55);
    const extraTopMarginForIndiaInfo = isIndiaCompany ? 18 : 0;
    const extraTopMarginForGstCode = isIndiaCompany && (data.companyGstCode || '') ? 8 : 0;
    const vatNo =
      printData?.VATNo ||
      printData?.vatNo ||
      printData?.GST_VAT ||
      printData?.GSTVAT ||
      data.invoice?.customerGstVat ||
      (data as any)?.companyVatNo ||
      '';
    const extraTopMarginForVatInfo = !isIndiaCompany && (isUaeCompany(data) || vatNo) ? 14 : 0;
    const billedTo = String(printData?.BilledTo || data.invoice?.customerName || '');
    const billingAddress = String(printData?.BillingAddress || data.invoice?.customerAddress || '');
    const billedToLines =
      estimateWrappedLineCount(billedTo, 34) +
      estimateWrappedLineCount(billingAddress, 52);
    const extraTopMarginForBilledTo = Math.max(0, billedToLines - 3) * 16;
    const dynamicTopMargin =
      baseTopMargin +
      extraTopMarginForLogo +
      extraTopMarginForIndiaInfo +
      extraTopMarginForGstCode +
      extraTopMarginForVatInfo +
      extraTopMarginForBilledTo;
    const configuredMargins = data.config?.pageMargins as number[] | undefined;
    const resolvedPageMargins = configuredMargins
      ? [
          configuredMargins[0] ?? 20,
          Math.max(configuredMargins[1] ?? dynamicTopMargin, dynamicTopMargin),
          configuredMargins[2] ?? 20,
          configuredMargins[3] ?? 30
        ]
      : [20, dynamicTopMargin, 20, 25];

    return {
      pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
      pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
      pageMargins: resolvedPageMargins,

      background: function (currentPage, pageSize) {
        
        return {
          canvas: [
            // LEFT BORDER
            { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.4 },
            // RIGHT BORDER
            { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.4 },
            // TOP BORDER
            { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.4 },
            // BOTTOM BORDER
            { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.4 }
          ]
        };
      },

      header: () => {
        return {
          stack: [
            buildInvoiceHeader(data),
            buildInvoiceTitle(data),
            buildInvoiceInfo(data),

            
          ],
          margin: [20, 10, 20, 0] // Add margin to header content
        };
      },

      content: [
        // { text: '', margin: [0, 10, 0, 0] },   // Spacer to push content below header
        buildShipmentDetails(data),
        buildChargesTable(data),
        buildTotalsSection(data),
        buildAmountAndVatSummary(data),
        // ...buildBankDetailsSection(data),
        buildTermsSectionWithBullets(data.terms || []),
        ...buildAuthorisedSignatory(data)
      ],
      footer: (currentPage: number, pageCount: number) => {
        const disclaimerText = 'This document is computer-generated and does not require a signature.';
        return {
          columns: [
            {
              text: `Printed By : ${data.userData?.userName || ''}`,
              fontSize: 7,
              alignment: 'left',
              width: '25%',
              noWrap: true
            },
            {
              text: disclaimerText,
              fontSize: 7,
              alignment: 'center',
              noWrap: true,
              width: '*'
            },
            {
              text: `Printed On : ${formatDate(new Date())}  Page ${currentPage} of ${pageCount}`,
              fontSize: 7,
              alignment: 'right',
              width: '30%',
              noWrap: true
            }
          ],
          margin: [30, 0, 30, 5]
        };
      },
      styles: getPdfStyles(),
      defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
    };
    
  }


  /**
   * Build invoice header
   */
  
  function buildInvoiceHeader(data: VendorInvoicePdfData): any {
    const company = data.company;
    const branch = data.branch;
    const logo = data.logo;
    const printSettings = data.printSettings || {
      logoPosition: 'left' as const,
      companyPosition: 'center' as const,
      companyAlignment: 'center' as const
    };
    const PAGE_LEFT = -10;
    const PAGE_RIGHT = 565;
    const isIndiaCompany = isIndianCompany(data);

    const LOGO_HEIGHT = INVOICE_LOGO_HEIGHT_PT; // 110px in HTML ~= 82.5pt in pdfMake

    const companyInfoStack: any[] = [];

    if (company?.companyName) {
      companyInfoStack.push({
        text: String(company.companyName).toUpperCase(),
        style: 'companyName',
        alignment: printSettings.companyAlignment,
        margin: [0, 0, 0, 2]
      });
    }

    const branchName = branch?.branchName || (branch as any)?.BranchName || '';
    if (branchName) {
      companyInfoStack.push({
        text: branchName,
        style: 'branchName',
        bold: true,
        alignment: printSettings.companyAlignment,
        margin: [0, 0, 0, 2]
      });
    }

    const cityName = branch?.cityMaster?.cityName || branch?.cityName || company?.city;
    const addressLine2 = branch?.addressLine2 || company?.addressLine2;
    const postalCode = branch?.postalCode || (branch as any)?.ZipCode || company?.postalCode;
    const phone = branch?.phoneNumber || company?.phoneNumber;
    const addressLine1 = branch?.addressLine1 || company?.addressLine1;
    if (addressLine1) {
      const hasMoreAddressDetails = !!(addressLine2 || cityName || postalCode || phone);
      companyInfoStack.push({
        text: isIndiaCompany && hasMoreAddressDetails ? `${addressLine1},` : addressLine1,
        style: 'addressText',
        alignment: printSettings.companyAlignment,
        margin: [0, 0, 0, 2]
      });
    }

    const detailLine: any[] = [];
    const appendDetail = (value: string | any[]) => {
      if (detailLine.length) detailLine.push({ text: ', ' });
      if (Array.isArray(value)) {
        detailLine.push(...value);
      } else {
        detailLine.push({ text: value });
      }
    };

    if (addressLine2) appendDetail(addressLine2);
    if (cityName) appendDetail(cityName);
    if (postalCode) appendDetail([{ text: 'Postal Code : ', bold: true }, { text: postalCode }]);
    if (phone) appendDetail([{ text: 'Ph.no : ', bold: true }, { text: phone }]);

    if (detailLine.length) {
      companyInfoStack.push({
        text: detailLine,
        style: 'addressText',
        alignment: printSettings.companyAlignment,
        margin: [0, 0, 0, 2]
      });
    }

    const companyTaxNo = isIndiaCompany
      ? data.companyGstCode || (branch as any)?.taxRegistrationNo || (company as any)?.GST_VAT || ''
      : data.companyPan || (data as any)?.companyVatNo || (company as any)?.Pan || (company as any)?.PAN || '';
    if (companyTaxNo) {
      companyInfoStack.push({
        text: `${isIndiaCompany ? 'GST No' : 'VAT No'} : ${companyTaxNo}`,
        style: 'addressText',
        alignment: printSettings.companyAlignment
      });
    }

    const slotAlign: Record<'left' | 'center' | 'right', 'left' | 'center' | 'right'> = {
      left: 'left',
      center: 'center',
      right: 'right'
    };

    const buildLogo = (slot: 'left' | 'center' | 'right'): any => ({
      image: logo,
      height: LOGO_HEIGHT,
      alignment: slotAlign[slot],
      margin: slot === 'right' ? [0, 0, 10, 0] : slot === 'left' ? [8, 0, 0, 0] : [0, 0, 0, 0]
    });

    const buildSlot = (slot: 'left' | 'center' | 'right') => {
      const stack: any[] = [];

      if (printSettings.logoPosition === slot && logo) {
        stack.push(buildLogo(slot));
      }

      if (printSettings.companyPosition === slot) {
        const companyMargin = slot === 'right'
          ? (stack.length ? [0, 4, 10, 0] : [0, 0, 10, 0])
          : (stack.length ? [0, 4, 0, 0] : [0, 0, 0, 0]);
        stack.push({ stack: companyInfoStack, margin: companyMargin });
      }

      return { stack };
    };

    const headerTable = {
      table: {
        widths: getVendorInvoiceHeaderWidths(printSettings.logoPosition, printSettings.companyPosition),
        body: [[buildSlot('left'), buildSlot('center'), buildSlot('right')]]
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0
      },
      margin: [0, 5, 0, 3]
    };

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

    return [headerTable, bottomLine];
  }

  function getVendorInvoiceHeaderWidths(
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


  /**
   * Build invoice title
   */
  function buildInvoiceTitle(data: VendorInvoicePdfData): any {
    const title = data.invoiceTitle ||
      (data.invoice?.postStatus === 'P' ? 'TAX INVOICE' : 'TAX INVOICE DRAFT');
    const isIndiaCompany = isIndianCompany(data);
    const gstCode = data.companyGstCode || '';

    return {
      stack: [
        {
          text: title,
          style: 'Tax Invoice',
          alignment: 'center',
          bold: true,
          fontSize: 12,
          margin: [0, 2, 0, isIndiaCompany && gstCode ? 2 : 7]
        },
        ...(isIndiaCompany && gstCode
          ? [{
              text: [
                { text: 'GST Code :', bold: true },
                { text: ` ${gstCode}` }
              ],
              alignment: 'center',
              margin: [0, 0, 0, 7]
            }]
          : [])
      ]
    };
  }

  /**
   * Build invoice info section - using vendorInvoiceData
   */
function buildInvoiceInfo(data: VendorInvoicePdfData): any {
  const invoice = data.invoice;
  const printData = (data as any).vendorInvoiceData || (data as any).invoicePrintData;
  const isIndiaCompany = isIndianCompany(data);
  const isUAECompany = isUaeCompany(data);


  const gstNo =
    printData?.GST_VAT ||
    printData?.GSTNo ||
    printData?.GSTVAT ||
    printData?.VendorGST_VAT ||
    printData?.VendorGSTVAT ||
    printData?.VendorGSTNo ||
    printData?.VendorTaxNumber ||
    (invoice as any)?.GST_VAT ||
    (invoice as any)?.GSTVAT ||
    (invoice as any)?.GSTNo ||
    (invoice as any)?.VendorGST_VAT ||
    invoice?.customerGstVat ||
    '';

  const vatNo =
    printData?.VATNo ||
    printData?.vatNo ||
    printData?.GST_VAT ||
    printData?.GSTVAT ||
    invoice?.customerGstVat ||
    (data as any)?.companyVatNo ||
    '';

  const irnNumber =
    printData?.IRNNumber ||
    printData?.IRNNo ||
    printData?.IRN ||
    invoice?.irnNumber ||
    '';

  const PAGE_LEFT = -10;
  const PAGE_RIGHT = 565;
  const RIGHT_LABEL_WIDTH = 95;
  const COLON_WIDTH = 6;

  // -----------------------------
  // Left side - Billed To
  // -----------------------------
  const billedTo = printData?.BilledTo || invoice?.customerName || '';
  const billingAddress = printData?.BillingAddress || invoice?.customerAddress || '';
  const LEFT_VALUE_INDENT = 10;
  const LEFT_VALUE_WIDTH = 225;

  const leftStack: any[] = [
    {
      text: 'BILLED BY',
      style: 'labelBold',
      margin: [0, 0, 0, 3]
    },
    {
      columns: [
        {
          text: billedTo,
          width: LEFT_VALUE_WIDTH
        }
      ],
      margin: [LEFT_VALUE_INDENT, 0, 0, 3]
    }
  ];

  if (billingAddress) {
    leftStack.push({
      columns: [
        {
          text: billingAddress,
          width: LEFT_VALUE_WIDTH,
          lineHeight: 1.08
        }
      ],
      margin: [LEFT_VALUE_INDENT, 0, 0, 1]
    });
  }

  if (!isIndiaCompany && (isUAECompany || vatNo)) {
    leftStack.push({
      columns: [
        { text: 'VAT No.', width: 40, style: 'labelBold' },
        { text: ':', width: COLON_WIDTH },
        { text: vatNo, width: '*' }
      ],
      margin: [0, 7, 0, 3]
    });
  }

  if (isIndiaCompany) {
    leftStack.push({
      columns: [
        { text: 'GST No.', width: 70, style: 'labelBold' },
        { text: ':', width: COLON_WIDTH },
        { text: gstNo, width: '*' }
      ],
      margin: [0, 8, 0, 3]
    });
  }

  // -----------------------------
  // Right side - Invoice Details
  // -----------------------------
  const rightStack: any[] = [];

  // Invoice No
  rightStack.push({
    columns: [
      { text: 'Vendor Invoice No', width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH },
      { text: printData?.InvoiceNo || invoice?.invoiceNo || '', width: '*' }
    ],
    margin: [0, 0, 0, 5]
  });

  // Invoice Date
  rightStack.push({
    columns: [
      { text: 'Vendor Invoice Date', width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH },
      {
        text: printData?.InvoiceDate
          ? formatDate(printData.InvoiceDate)
          : formatDate(invoice?.invoiceDate),
        width: '*'
      }
    ],
    margin: [0, 0, 0, 5]
  });

  // ✅ FIXED: India → GST + IRN | UAE → VAT No only | Others → nothing
  if (isIndiaCompany) {
    rightStack.push({
      columns: [
        { text: 'IRN No.', width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
        { text: ':', width: COLON_WIDTH },
        { text: irnNumber, width: '*' }
      ],
      margin: [0, 0, 0, 7]
    });
  }

  // Remove bottom margin from the LAST row
  if (rightStack.length > 0) {
    rightStack[rightStack.length - 1].margin = [0, 0, 0, 0];
  }

  // -----------------------------
  // Two Column Layout
  // -----------------------------
  const twoColumnLayout = {
    columns: [
      { width: '49%', stack: leftStack },
      { width: '51%', stack: rightStack }
    ],
    columnGap: 0,
    margin: [8, 0, 0, 0]
  };

  const bottomLine = {
    canvas: [
      {
        type: 'line',
        x1: PAGE_LEFT,
        y1: 0,
        x2: PAGE_RIGHT,
        y2: 0,
        lineWidth: 0.8
      }
    ],
    margin: [0, 10, 0, 0]
  };

  return {
    stack: [twoColumnLayout, bottomLine],
    margin: [0, 0, 0, 0]
  };
}


  /**
   * Build shipment details - using vendorInvoiceData
   */
function buildShipmentDetails(data: VendorInvoicePdfData): any {
  const invoice = data.invoice;
  const printData = (data as any).vendorInvoiceData || (data as any).invoicePrintData;
  const cargo = data.cargoDetails;
  const isSeaMode = data.isSeaMode !== false;
  const isNonJob = (printData?.CashOrBank || (data as any)?.invoiceData?.CashOrBank || '') === 'Y';
  
  const PAGE_LEFT = -10;
  const PAGE_RIGHT = 565;

  const RIGHT_LABEL_WIDTH = 88;
  const COLON_WIDTH = 5;

  // -----------------------------
  // Left Column Data
  // -----------------------------
  const leftItems: { label: string; value: string }[] = [
    ...(isNonJob ? [] : [
      { label: 'Shipper', value: printData?.ShipperName || invoice?.shipperName || '' },
      { label: 'Consignee / Notify', value: printData?.ConsigneeName || invoice?.consigneeName || '' },
      { label: isSeaMode ? 'Vessel Name' : 'Flight Name', value: printData?.Vessel || invoice?.vesselName || '' },
      { label: isSeaMode ? 'Voyage No.' : 'Flight No.', value: printData?.VoyageNo || invoice?.voyageNo || '' }
    ]),
    { label: 'Bill No.', value: printData?.DocumentNumber || invoice?.shipperRefNo || '' },
    { label: 'Bill Date', value: formatDate(printData?.DocumentDate)},
    ...(isNonJob ? [] : [
      { label: 'Loading Port', value: printData?.POL || invoice?.loadingPort || invoice?.pol || '' },
      { label: 'Final Destination', value: printData?.FPD || invoice?.finalDestination || invoice?.fpd || '' },
      { label: 'ETD', value: printData?.ETD ? formatDate(printData.ETD) : formatDate(invoice?.etd || '') },
      { label: 'ETA', value: printData?.ETA ? formatDate(printData.ETA) : formatDate(invoice?.eta || '') }
    ])
  ];

  // -----------------------------
  // Right Column Data
  // -----------------------------
  const dueDate = printData?.InvoiceDueDate || invoice?.invoiceDueDate || invoice?.dueDate;

  const currExRate =
    printData?.CurrExRate ||
    (invoice?.currencyCode && invoice?.exchangeRate
      ? `${invoice.currencyCode} / ${invoice.exchangeRate}`
      : invoice?.currencyCode || '');

  const rightItems: { label: string; value: string }[] = [
    ...(!isNonJob && printData?.IsServiceJob !== 'Y' && printData?.JobType !== 'Agent'
  ? [{
      label: isSeaMode ? 'HBL' : 'HAWB',
      value: printData?.HBLNo || invoice?.hblNo || ''
    }]
  : []),
    ...(!isNonJob && printData?.IsServiceJob !== 'Y'
  ? [{
      label: isSeaMode ? 'MBL' : 'MAWB',
      value: printData?.MBLNo || invoice?.mblNo || ''
    }]
  : []),
    ...(!isNonJob ? [{ label: 'Job No.', value: printData?.MasterJobNumber || invoice?.jobNo || '' }] : []),
    ...(!isNonJob ? [{ label: 'Booking No.', value: printData?.BookingNumber || invoice?.bookingNo || '' }] : []),
    { label: 'Narration', value:  printData?.Naration},
    ...(!isNonJob ? [{ label: 'Freight Terms', value: printData?.FreightTerms || invoice?.freightTerms || '' }] : []),
    // { label: 'Invoice Due Date', value: dueDate ? formatDate(dueDate) : '' },
    { label: 'Currency / Ex-Rate', value: currExRate }
  ];

  // -----------------------------
  // Build Left Stack
  // -----------------------------
  const leftStack = leftItems.map(item => ({
    columns: [
      { text: item.label, width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH },
      { text: item.value, width: '*' }
    ],
    margin: [0, 2, 0, 3]
  }));

  // -----------------------------
  // Build Right Stack
  // -----------------------------
  const rightStack: any[] = rightItems.map(item => ({
    columns: [
      { text: item.label, width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH },
      { text: item.value, width: '*' }
    ],
    margin: [0, 2, 0, 2]
  }));

  // -----------------------------
  // Cargo Table (Optional)
  // -----------------------------
  if (!isNonJob && (printData || cargo)) {
    const cargoData = {
      packages: printData?.pkg || cargo?.packages || '0',
      desc: printData?.desc || cargo?.commodityDesc || '',
      grosswt: printData?.grosswt || cargo?.grossWeight || 0,
      cbm: printData?.cbm || cargo?.cbm || 0,
      chargeableWeight: printData?.ChargeableWeight || cargo?.chargeableWeight || 0
    };

    rightStack.push({
      table: {
        headerRows: 1,
        widths: [45, '*', 55, 55],
        body: [
          [
            { text: 'Pkg', style: 'tableHeader', alignment: 'center', fontSize: 8 },
            { text: 'Commodity Desc', style: 'tableHeader', alignment: 'center', fontSize: 8 },
            { text: 'Gross Wt.', style: 'tableHeader', alignment: 'center', fontSize: 8 },
            { text: isSeaMode ? 'CBM' : 'Charge Wt.', style: 'tableHeader', alignment: 'center', fontSize: 8 }
          ],
          [
            { text: String(cargoData.packages), alignment: 'center', noWrap: true, fontSize: 8 },
            { text: cargoData.desc, fontSize: 8 },
            { text: formatNumberWithCommas(Number(cargoData.grosswt) || 0, 3), alignment: 'right', fontSize: 8 },
            {
              text: formatNumberWithCommas(
                Number(isSeaMode ? cargoData.cbm : cargoData.chargeableWeight) || 0,
                3
              ),
              alignment: 'right',
              fontSize: 8
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 3,
        paddingBottom: () => 3
      },
      margin: [0, 4, 0, 0]
    });
  }

  // -----------------------------
  // Final Layout
  // -----------------------------
  return {
    stack: [
      {
        table: {
          widths: ['50%', '50%'],
          body: [[
            { stack: leftStack, margin: [5, 2, 5, 2] },
            { stack: rightStack, margin: [5, 2, 5, 2] }
          ]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 0]
      }
    ],
    margin: [0, 0, 0, 0]
  };
}

  /**
   * Build charges table - using vendorInvoiceData.voucherDetails
   */
 function buildChargesTable(data: VendorInvoicePdfData): any {
  const charges = data.charges || [];
  const printData = (data as any).vendorInvoiceData || (data as any).invoicePrintData;
  const voucherDetails = printData?.voucherDetails || [];
  const isIndiaCompany = isIndianCompany(data);
  const showVATColumns = isUaeCompany(data);

  const taxConfig = data.taxDisplayConfig || {
    showCGST: false,
    showSGST: false,
    showIGST: false,
    showVAT: false
  };

  const localCurrency = data.localCurrency || 'AED';
  const invoiceCurr = data.invoice?.currencyCode;
  const grandTotal = printData?.totalPartyAmount || data.totals?.grandTotal || 0;
  const hasForeignCurrencyColumn = !!(invoiceCurr && invoiceCurr !== localCurrency);

  const displayDetails = voucherDetails.length > 0 ? voucherDetails : charges;
  if (!displayDetails.length) return { text: '' };

  return (() => {
    const firstFilled = (...values: any[]): string => {
      for (const value of values) {
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          return String(value);
        }
      }

      return '';
    };

    const formatValue = (value: any, decimals: number): string =>
      formatNumberWithCommas(parsePdfNumber(value), decimals);

    const numericCell = (value: any, decimals: number): any => ({
      text: formatValue(value, decimals),
      style: 'tableCellSmall',
      alignment: 'right',
      noWrap: true,
      fontSize: 7
    });

    const companyCurrencyCell = (value: any): any => ({
      text: formatCompanyCurrencyAmount(data, value),
      style: 'tableCellSmall',
      alignment: 'right',
      noWrap: true,
      fontSize: 7
    });

    const vendorInvoiceCurrencyCell = (value: any): any => ({
      text: formatVendorInvoiceCurrencyAmount(data, value),
      style: 'tableCellSmall',
      alignment: 'right',
      noWrap: true,
      fontSize: 7
    });

    const headerRow: any[] = [
      { text: 'S.No', style: 'tableHeaderSmall', alignment: 'center' },
      { text: 'Particulars', style: 'tableHeaderSmall', alignment: 'center' },
      ...(isIndiaCompany ? [{ text: 'HSN/SAC', style: 'tableHeaderSmall', alignment: 'center' }] : []),
      { text: 'Curr.', style: 'tableHeaderSmall', alignment: 'center' },
      { text: 'No. of Unit', style: 'tableHeaderSmall', alignment: 'center' },
      { text: 'Rate', style: 'tableHeaderSmall', alignment: 'center' },
      { text: 'ROE', style: 'tableHeaderSmall', alignment: 'center' },
      { text: 'Taxable Amt', style: 'tableHeaderSmall', alignment: 'center' }
    ];

    if (taxConfig.showCGST) {
      headerRow.push(
        { text: 'CGST %', style: 'tableHeaderSmall', alignment: 'right' },
        { text: 'CGST Amt', style: 'tableHeaderSmall', alignment: 'right' }
      );
    }

    if (taxConfig.showSGST) {
      headerRow.push(
        { text: 'SGST %', style: 'tableHeaderSmall', alignment: 'right' },
        { text: 'SGST Amt', style: 'tableHeaderSmall', alignment: 'right' }
      );
    }

    if (taxConfig.showIGST) {
      headerRow.push(
        { text: 'IGST %', style: 'tableHeaderSmall', alignment: 'right' },
        { text: 'IGST Amt', style: 'tableHeaderSmall', alignment: 'right' }
      );
    }

    if (showVATColumns) {
      headerRow.push(
        { text: 'VAT %', style: 'tableHeaderSmall', alignment: 'right' },
        { text: 'VAT Amt.', style: 'tableHeaderSmall', alignment: 'right' }
      );
    }

    headerRow.push({
      text: `Amt In ${localCurrency}`,
      style: 'tableHeaderSmall',
      alignment: 'right'
    });

    if (hasForeignCurrencyColumn) {
      headerRow.push({
        text: `Amt In ${invoiceCurr}`,
        style: 'tableHeaderSmall',
        alignment: 'right'
      });
    }

    const dataRows = displayDetails.map((detail: any, index: number) => {
      const row: any[] = [
        {
          text: firstFilled(detail.Sno, detail.sno, index + 1),
          style: 'tableCellSmall',
          alignment: 'center',
          fontSize: 7
        },
        {
          text: firstFilled(
            detail.ChargeDescription,
            detail.chargeName,
            detail.SubledgerName,
            detail.Subledger,
            detail.Narration
          ),
          style: 'tableCellSmall',
          fontSize: 7,
          noWrap: false
        },
        ...(isIndiaCompany
          ? [{
              text: firstFilled(
                detail.HSNCode,
                detail.HSNSAC,
                detail.hsnSacCode,
                detail.hSSACMaster?.HSSACCode,
                '-'
              ),
              style: 'tableCellSmall',
              alignment: 'center',
              fontSize: 7
            }]
          : []),
        {
          text: firstFilled(detail.CurrencyCode, detail.currencyCode),
          style: 'tableCellSmall',
          alignment: 'center',
          fontSize: 7
        },
        numericCell(firstFilled(detail.NumberOfUnit, detail.qty, '1'), 3),
        numericCell(firstFilled(detail.Rate, detail.rate, '0'), 2),
        numericCell(firstFilled(detail.ExchangeRate, detail.roe, '1'), 4),
        companyCurrencyCell(firstFilled(detail.TaxableAmount, detail.taxableAmount, detail.Amount, detail.amount, '0'))
      ];

      if (taxConfig.showCGST) {
        row.push(
          numericCell(firstFilled(detail.cgstRate, detail.cgstPercent ?? Number(detail.TaxPercentage1) / 2), 3),
          companyCurrencyCell(firstFilled(detail.cgstAmt, detail.cgstAmount ?? Number(detail.TaxAmount1) / 2))
        );
      }

      if (taxConfig.showSGST) {
        row.push(
          numericCell(firstFilled(detail.sgstRate, detail.sgstPercent ?? Number(detail.TaxPercentage1) / 2), 3),
          companyCurrencyCell(firstFilled(detail.sgstAmt, detail.sgstAmount ?? Number(detail.TaxAmount1) / 2))
        );
      }

      if (taxConfig.showIGST) {
        row.push(
          numericCell(firstFilled(detail.igstRate, detail.igstPercent ?? detail.TaxPercentage1), 3),
          companyCurrencyCell(firstFilled(detail.igstAmt, detail.igstAmount ?? detail.TaxAmount1))
        );
      }

      if (showVATColumns) {
        row.push(
          numericCell(firstFilled(detail.vatRate, detail.vatPercent ?? detail.TaxPercentage1), 3),
          companyCurrencyCell(firstFilled(detail.vatAmt, detail.vatAmount ?? detail.TaxAmount1))
        );
      }

      row.push(companyCurrencyCell(firstFilled(detail.LocalAmount, detail.localAmount, '0')));

      if (hasForeignCurrencyColumn) {
        row.push(vendorInvoiceCurrencyCell(firstFilled(detail.PartyAmount, detail.partyAmount, '0')));
      }

      return row;
    });

    const totalRow: any[] = showVATColumns
      ? buildVendorInvoiceVatTotalRow(data, displayDetails, isIndiaCompany, hasForeignCurrencyColumn, grandTotal)
      : buildDefaultVendorInvoiceTotalRow(data, headerRow.length, grandTotal);

    const widths: (number | string)[] = showVATColumns && !hasForeignCurrencyColumn && !isIndiaCompany
      ? [22, 85, 30, 52, 52, 38, 76, 38, 58, '*']
      : [
          22,
          90,
          ...(isIndiaCompany ? [34] : []),
          25,
          42,
          42,
          36,
          58
        ];

    if (!(showVATColumns && !hasForeignCurrencyColumn && !isIndiaCompany)) {
      if (taxConfig.showCGST) widths.push(28, 45);
      if (taxConfig.showSGST) widths.push(28, 45);
      if (taxConfig.showIGST) widths.push(28, 45);
      if (showVATColumns) widths.push(28, 45);

      widths.push('*');

      if (hasForeignCurrencyColumn) {
        widths.push(62);
      }
    }

    return {
      table: {
        headerRows: 1,
        widths,
        body: [headerRow, ...dataRows, totalRow]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingLeft: () => 2,
        paddingRight: () => 2,
        paddingTop: () => 3,
        paddingBottom: () => 3
      },
      margin: [-10, 0, -10, 2],
      style: { noWrap: false }
    };
  })();
}


  /**
   * Build totals section
   */
  function buildTotalsSection(data: VendorInvoicePdfData): any {
    return { text: '' };
  }

  function buildDefaultVendorInvoiceTotalRow(data: VendorInvoicePdfData, colCount: number, grandTotal: any): any[] {
    const totalRow: any[] = [];

    for (let i = 0; i < colCount - 2; i++) {
      totalRow.push({ text: '', style: 'tableCellSmall' });
    }

    totalRow.push({ text: 'Total', style: 'tableCellBoldSmall', alignment: 'right', noWrap: true, fontSize: 7 });
    totalRow.push({
      text: formatVendorInvoiceCurrencyAmount(data, grandTotal),
      style: 'tableCellBoldSmall',
      alignment: 'right',
      noWrap: true,
      fontSize: 7
    });

    return totalRow;
  }

  function buildVendorInvoiceVatTotalRow(
    data: VendorInvoicePdfData,
    details: any[],
    showHsnSac: boolean,
    hasForeignCurrencyColumn: boolean,
    grandTotal: any
  ): any[] {
    const baseColumns = 7 + (showHsnSac ? 1 : 0);
    const totalRow: any[] = [];

    for (let i = 0; i < baseColumns; i++) {
      totalRow.push({ text: '', style: 'tableCellSmall' });
    }

    totalRow.push({ text: 'Total', style: 'tableCellBoldSmall', alignment: 'right', noWrap: true, fontSize: 7 });
    totalRow.push({
      text: formatCompanyCurrencyAmount(data, sumPdfDetailAmount(details, 'vatAmt', 'vatAmount')),
      style: 'tableCellBoldSmall',
      alignment: 'right',
      noWrap: true,
      fontSize: 7
    });
    totalRow.push({
      text: hasForeignCurrencyColumn
        ? formatCompanyCurrencyAmount(data, sumPdfDetailAmount(details, 'LocalAmount', 'localAmount'))
        : formatVendorInvoiceCurrencyAmount(data, grandTotal),
      style: 'tableCellBoldSmall',
      alignment: 'right',
      noWrap: true,
      fontSize: 7
    });

    if (hasForeignCurrencyColumn) {
      totalRow.push({
        text: formatVendorInvoiceCurrencyAmount(data, grandTotal),
        style: 'tableCellBoldSmall',
        alignment: 'right',
        noWrap: true,
        fontSize: 7
      });
    }

    return totalRow;
  }

  function sumPdfDetailAmount(details: any[], primaryField: string, fallbackField: string): number {
    return (details || []).reduce((sum: number, detail: any) => {
      return sum + parsePdfNumber(detail?.[primaryField] ?? detail?.[fallbackField]);
    }, 0);
  }

  function parsePdfNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    return Number(String(value).replace(/,/g, '')) || 0;
  }

  function getVendorInvoiceDisplayDetails(data: VendorInvoicePdfData): any[] {
    const printData = (data as any).vendorInvoiceData || (data as any).invoicePrintData;
    const voucherDetails = printData?.voucherDetails || [];
    return voucherDetails.length > 0 ? voucherDetails : (data.charges || []);
  }

  function getVendorInvoiceVatSummary(data: VendorInvoicePdfData): Array<{ vatRate: string; vatRateDisplay: string; taxableAmount: number; vatAmt: number }> {
    const summary = new Map<string, { vatRate: string; vatRateDisplay: string; taxableAmount: number; vatAmt: number }>();
    const isUAECompany = isUaeCompany(data);

    for (const detail of getVendorInvoiceDisplayDetails(data)) {
      const vatRate = detail?.vatRate ?? detail?.vatPercent ?? detail?.TaxPercentage1 ?? '0.000';
      const key = isUAECompany ? (detail?.taxGroupName || 'Unmapped') : String(vatRate);
      const display = isUAECompany ? (detail?.taxGroupName || 'Unmapped') : String(vatRate);
      const summaryRow = summary.get(key) || {
        vatRate: String(vatRate),
        vatRateDisplay: display,
        taxableAmount: 0,
        vatAmt: 0,
      };

      summaryRow.taxableAmount += parsePdfNumber(detail?.TaxableAmount ?? detail?.taxableAmount);
      summaryRow.vatAmt += parsePdfNumber(detail?.vatAmt ?? detail?.vatAmount ?? detail?.TaxAmount1);
      summary.set(key, summaryRow);
    }

    return Array.from(summary.values());
  }

  function buildVatSummaryTable(data: VendorInvoicePdfData): any {
    const details = getVendorInvoiceDisplayDetails(data);

    return {
      table: {
        widths: [44, 75, 54],
        body: [
          [
            { text: 'Tax Type', bold: true, alignment: 'center', fontSize: 6.5 },
            { text: 'Taxable Amt.', bold: true, alignment: 'center', fontSize: 6.5 },
            { text: 'Tax', bold: true, alignment: 'center', fontSize: 6.5 }
          ],
          ...getVendorInvoiceVatSummary(data).map((detail) => [
            { text: detail.vatRateDisplay, alignment: 'right', fontSize: 6.5 },
            { text: formatCompanyCurrencyAmount(data, detail.taxableAmount), alignment: 'right', fontSize: 6.5, noWrap: true },
            { text: formatCompanyCurrencyAmount(data, detail.vatAmt), alignment: 'right', fontSize: 6.5, noWrap: true }
          ]),
          [
            { text: 'Total', bold: true, alignment: 'right', fontSize: 6.5 },
            {
              text: formatCompanyCurrencyAmount(data, sumPdfDetailAmount(details, 'TaxableAmount', 'taxableAmount')),
              bold: true,
              alignment: 'right',
              fontSize: 6.5,
              noWrap: true
            },
            {
              text: formatCompanyCurrencyAmount(data, sumPdfDetailAmount(details, 'vatAmt', 'vatAmount')),
              bold: true,
              alignment: 'right',
              fontSize: 6.5,
              noWrap: true
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingLeft: () => 2,
        paddingRight: () => 2,
        paddingTop: () => 1,
        paddingBottom: () => 1
      }
    };
  }

  function buildAmountAndVatSummary(data: VendorInvoicePdfData): any {
    const printData = (data as any).vendorInvoiceData || (data as any).invoicePrintData;
    const amountInWords = printData?.AmountInWords || data.amountInWords || '';
    const remarks = printData?.Remarks || data.invoice?.remarks || '';
    const showVATSummary = !!data.taxDisplayConfig?.showVAT;
    const leftStack: any[] = [];

    if (amountInWords) {
      leftStack.push({
        columns: [
          { width: 92, text: 'Amount In Words', style: 'labelBold', fontSize: 9.5 },
          { width: 10, text: ':', alignment: 'center', fontSize: 9.5 },
          { width: '*', text: amountInWords, fontSize: 8.5, lineHeight: 1.15 }
        ],
        margin: [0, 0, 0, 5]
      });
    }

    leftStack.push({
      columns: [
        { width: 92, text: 'Remarks', style: 'labelBold', fontSize: 9 },
        { width: 10, text: ':', alignment: 'center', fontSize: 9 },
        { width: '*', text: remarks, fontSize: 8, lineHeight: 1.15 }
      ]
    });

    if (!leftStack.length && !showVATSummary) {
      return { text: '' };
    }

    return {
      columns: [
        {
          width: 310,
          stack: leftStack,
          margin: [12, 0, 0, 0]
        },
        ...(showVATSummary
          ? [{
              width: 50,
              text: ''
            }]
          : []),
        ...(showVATSummary
          ? [{
              width: 174,
              stack: [buildVatSummaryTable(data)]
            }]
          : [])
      ],
      columnGap: showVATSummary ? 3 : 0,
      margin: [0, 2, 0, 0]
    };
  }

  /**
   * Build amount in words
   */

  function buildAmountInWords(data: VendorInvoicePdfData): any {
    const printData = (data as any).vendorInvoiceData || (data as any).invoicePrintData;
    const amountInWords = printData?.AmountInWords || data.amountInWords;

    if (!amountInWords) {
      return { text: '' };
    }

    return {
      margin: [0, 0, 0, 0],
      columns: [
        {
          width: 88,
          text: 'Amount In Words',
          style: 'labelBold'
        },
        {
          width: 0,
          text: ':',
         
        },
        {
          width: '*',
          text: amountInWords,
          // italics: true 
        }
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
      {
        width: 90,
        text: 'Remarks',
        style: 'labelBold'
      },
      {
        width: 10,
        text: ':',
        alignment: 'center'
      },
      {
        width: '*',
        text: remarks
      }
    ]
  };
}


  /**
   * Build bank details section
   */

// function buildBankDetailsSection(data: VendorInvoicePdfData): any[] {
//   const bankDetails = data.bankDetails || [];
//   const isVATMode = data.isVATMode !== false;

//   // Get just the currency code (e.g., USD, AED)
//   const invoiceCurrency = data.invoice?.currencyCode || '';
//   const localCurrency = data.localCurrency || '';
//   const currencyCode = invoiceCurrency || localCurrency;

//   if (bankDetails.length === 0) return [];

//   // Filter valid banks with at least one field populated
//   const validBanks = bankDetails.filter(bank => 
//     bank.beneficiaryName || 
//     bank.accountNo || 
//     bank.bankName || 
//     bank.iban || 
//     bank.ifscCode || 
//     bank.swiftCode ||
//     bank.bankAddress || 
//     bank.branchName
//   );

//   if (validBanks.length === 0) return [];

//   // Limit to maximum 3 banks to prevent overflow
//   const banksToDisplay = validBanks.slice(0, 3);

//   // Create header row
//   const headers = [
//     { text: 'Details', style: 'tableHeader', alignment: 'center' }
//   ];

//   // Add bank columns dynamically
//   for (let i = 0; i < banksToDisplay.length; i++) {
//     if (currencyCode) {
//       headers.push({ 
//         text: `Bank (${currencyCode})`, 
//         style: 'tableHeader', 
//         alignment: 'center' 
//       });
//     } else {
//       headers.push({ 
//         text: `Bank ${i + 1}`, 
//         style: 'tableHeader', 
//         alignment: 'center' 
//       });
//     }
//   }

//   const rows: any[] = [headers];

//   // Beneficiary Name row
//   const beneficiaryRow: any[] = [{ 
//     text: 'Beneficiary Name', 
//     style: 'labelBold', 
//     alignment: 'left',
//     fontSize: 8  // Reduced font size
//   }];
//   for (let i = 0; i < banksToDisplay.length; i++) {
//     beneficiaryRow.push({ 
//       text: banksToDisplay[i].beneficiaryName || '', 
//       alignment: 'left',
//       noWrap: false,
//       fontSize: 8  // Reduced font size
//     });
//   }
//   rows.push(beneficiaryRow);

//   // Account No. row
//   const accountRow: any[] = [{ 
//     text: 'Account No.', 
//     style: 'labelBold', 
//     alignment: 'left',
//     fontSize: 8
//   }];
//   for (let i = 0; i < banksToDisplay.length; i++) {
//     accountRow.push({ 
//       text: banksToDisplay[i].accountNo || '', 
//       alignment: 'left',
//       noWrap: false,
//       fontSize: 8
//     });
//   }
//   rows.push(accountRow);

//   // IBAN/IFSC row
//   const ibanRow: any[] = [{ 
//     text: isVATMode ? 'IBAN' : 'IFSC Code', 
//     style: 'labelBold', 
//     alignment: 'left',
//     fontSize: 8
//   }];
//   for (let i = 0; i < banksToDisplay.length; i++) {
//     if (isVATMode) {
//       ibanRow.push({ 
//         text: banksToDisplay[i].iban || '', 
//         alignment: 'left',
//         noWrap: false,
//         fontSize: 8
//       });
//     } else {
//       ibanRow.push({ 
//         text: banksToDisplay[i].ifscCode || '', 
//         alignment: 'left',
//         noWrap: false,
//         fontSize: 8
//       });
//     }
//   }
//   rows.push(ibanRow);

//   // Swift Code row
//   const swiftRow: any[] = [{ 
//     text: 'Swift Code', 
//     style: 'labelBold', 
//     alignment: 'left',
//     fontSize: 8
//   }];
//   for (let i = 0; i < banksToDisplay.length; i++) {
//     swiftRow.push({ 
//       text: banksToDisplay[i].swiftCode || '', 
//       alignment: 'left',
//       noWrap: false,
//       fontSize: 8
//     });
//   }
//   rows.push(swiftRow);

//   // Bank Name row
//   const bankNameRow: any[] = [{ 
//     text: 'Bank Name', 
//     style: 'labelBold', 
//     alignment: 'left',
//     fontSize: 8
//   }];
//   for (let i = 0; i < banksToDisplay.length; i++) {
//     bankNameRow.push({ 
//       text: banksToDisplay[i].bankName || '', 
//       alignment: 'left',
//       noWrap: false,
//       fontSize: 8
//     });
//   }
//   rows.push(bankNameRow);

//   // Branch row
//   const branchRow: any[] = [{ 
//     text: 'Branch', 
//     style: 'labelBold', 
//     alignment: 'left',
//     fontSize: 8
//   }];
//   for (let i = 0; i < banksToDisplay.length; i++) {
//     branchRow.push({ 
//       text: banksToDisplay[i].bankAddress || banksToDisplay[i].branchName || '', 
//       alignment: 'left',
//       noWrap: false,
//       lineHeight: 1.1,  // Reduced from 1.2
//       fontSize: 8
//     });
//   }
//   rows.push(branchRow);

//   // Width behavior:
//   // - 1 bank: fit to content (no forced extra empty space on the right)
//   // - 2/3 banks: distribute available width evenly
//   const DETAILS_COLUMN_WIDTH = 110;
//   const bankCount = Math.max(1, banksToDisplay.length);
//   const widths: (number | string)[] = [DETAILS_COLUMN_WIDTH];

//   if (bankCount === 1) {
//     widths.push('auto');
//   } else {
//     const TOTAL_WIDTH = 500; // Total available width (accounting for page margins)
//     const REMAINING_WIDTH = TOTAL_WIDTH - DETAILS_COLUMN_WIDTH;
//     const BANK_COLUMN_WIDTH = REMAINING_WIDTH / bankCount;
//     for (let i = 0; i < banksToDisplay.length; i++) {
//       widths.push(BANK_COLUMN_WIDTH);
//     }
//   }

//   return [
//     buildSectionTitle('Bank Details', { margin: [0, 10, 0, 3] }),  // Reduced margin
//     {
//       table: {
//         headerRows: 1,
//         widths: widths,
//         body: rows,
//         dontBreakRows: true
//       },
//       layout: {
//         hLineWidth: () => 1,
//         vLineWidth: () => 1,
//         hLineColor: () => '#000',
//         vLineColor: () => '#000',
//         paddingLeft: () => 3,      // Reduced from 6
//         paddingRight: () => 3,     // Reduced from 6
//         paddingTop: () => 2,       // Reduced from 5
//         paddingBottom: () => 2     // Reduced from 5
//       },
//       margin: [0, 0, 0, 5],  // Reduced bottom margin from 10 to 5
//       style: { noWrap: false }
//     }
//   ];
// }

  /**
   * Build terms section with bullet points
   */
  function buildTermsSectionWithBullets(terms: (PdfTermItem | string)[]): any {
    const termsList = (terms || []).map((term) => {
      const content = typeof term === 'string' ? term : term.content;
      return content;
    }).filter((content) => !!content?.trim());

    return {
      stack: [
        { text: 'Terms and Conditions', style: 'sectionTitle', margin: [0, 10, 0, 5] },
        ...(termsList.length > 0
          ? [{
              ul: termsList,
              margin: [0, 0, 0, 10]
            }]
          : [])
      ],
      margin: [0, 0, 0, 15]
    };
  }

  /**
   * Build authorised signatory
   */
  function buildAuthorisedSignatory(data: VendorInvoicePdfData): any[] {
    if (data.authorisedSignatory === false) {
      return [];
    }

    const companyName = data.company?.companyName || '';

    return [{
      stack: [
        { 
          text: companyName ? `For ${companyName}` : '', 
          alignment: 'right', 
          margin: [0, 0, 0, 2] // Minimal spacing
        },
        { 
          text: 'Authorised Signatory', 
          alignment: 'right', 
          style: 'labelBold' 
        }
      ],
      margin: [0, 0, 0, 0] // Minimal spacing
    }];
  }
  /**
   * Transform API data to VendorInvoicePdfData format
   * IMPORTANT: This receives the RAW API data (invoiceData), not vendorInvoiceData
   */
  export function transformVendorInvoiceApiData(
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
      companyVatNo?: string;
      printSettings?: {
        logoPosition: 'left' | 'center' | 'right';
        companyPosition: 'left' | 'center' | 'right';
        companyAlignment: 'left' | 'center' | 'right';
      };
      shipmentDetails?: any;
      cargoDetails?: any;
      vendorInvoiceData?: any; // CRITICAL: The formatted print data
      invoicePrintData?: any; // Backward compatibility
    }
  ): VendorInvoicePdfData {
    const invoice = apiData;
    const masterJob = invoice.masterJob;
    const houseJob = invoice.houseJob;
    const bookingHeader = invoice.BookingHeader;

    const isHouseJobInvoice = !!(houseJob && masterJob);
    const isBookingInvoice = !!invoice.BookingHeaderSid;

    const getHSSACCode = (hssacId: number): string => {
      if (!hssacId || !lookups?.hssacMaster) return '';
      const hssac = lookups.hssacMaster.find((h: any) => h.HSSACMasterSid === hssacId);
      return hssac?.HSSACCode || '';
    };

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
        hsnSacCode: getHSSACCode(detail.HSSACMasterSid),
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
        cgstPercent: Number(detail.TaxPercentage1) / 2 || 0,
        cgstAmount: Number(detail.TaxAmount1) / 2 || 0,
        sgstPercent: Number(detail.TaxPercentage1) / 2 || 0,
        sgstAmount: Number(detail.TaxAmount1) / 2 || 0,
        igstPercent: Number(detail.TaxPercentage1) || 0,
        igstAmount: Number(detail.TaxAmount1) || 0,
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
      const tax = (charge.cgstAmount || 0) + (charge.sgstAmount || 0) +
                  (charge.igstAmount || 0) + (charge.vatAmount || 0);
      return sum + tax;
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
      beneficiaryName: bank.BeneficiaryName || bank.beneficiaryName || bank.AccountName || bank.accountName || ''
    }));

    const terms: PdfTermItem[] = (options?.terms || []).map((term: any) => ({
      content: term.TandC || ''
    }));

    const result: any = {
      company: {
        companyName: company?.companyName || '',
        CompanyMasterSid: company?.CompanyMasterSid,
        CurrencyMasterSid: company?.CurrencyMasterSid,
        addressLine1: company?.addressLine1 || company?.Address || '',
        addressLine2: company?.addressLine2 || '',
        city: company?.City || '',
        countryCode: company?.countryMaster?.countryCode || company?.CountryCode || company?.countryCode || company?.country?.countryCode || '',
        postalCode: company?.postal_code || company?.ZipCode || '',
        phoneNumber: company?.phoneNumber || company?.Phone || ''
      },
      branch: {
        branchName: branch?.branchName || '',
        addressLine1: branch?.addressLine1 || '',
        addressLine2: branch?.addressLine2 || '',
        cityName: branch?.cityMaster?.cityName || '',
        countryCode: branch?.countryMaster?.countryCode || branch?.CountryCode || branch?.countryCode || branch?.country?.countryCode || '',
        postalCode: branch?.postalCode || branch?.ZipCode || '',
        phoneNumber: branch?.phoneNumber || '',
        cityMaster: branch?.cityMaster
      },
      userData: {
        userName: userData?.userName || '',
        email: userData?.email || ''
      },
      logo,
      invoiceTitle: options?.invoiceTitle || (invoice.PostStatus === 'P' ? 'TAX INVOICE' : 'TAX INVOICE DRAFT'),
      companyGstCode: branch?.taxRegistrationNo || company?.GST_VAT || '',
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
        CurrencyMasterSid: invoice.CurrencyMasterSid,
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
        jobType: isHouseJobInvoice ? houseJob?.JobType : (isBookingInvoice ? bookingHeader?.JobType :  masterJob?.JobType) || '',
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
        containerType: masterJob?.ContainerType || houseJob?.ContainerType || '',
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
        showIGST: false,
        showVAT: true
      },
      companyVatNo: options?.companyVatNo || branch?.taxRegistrationNo || company?.GST_VAT || '',
      isSeaMode: options?.isSeaMode,
      isVATMode: options?.isVATMode,
      authorisedSignatory: true,
      currencyMaster: lookups?.currencyMaster || [],
      cargoDetails: options?.cargoDetails,
      printSettings: options?.printSettings || {
        logoPosition: 'left',
        companyPosition: 'center',
        companyAlignment: 'center'
      },
      vendorInvoiceData: options?.vendorInvoiceData || options?.invoicePrintData, // Pass through vendor print data
      invoicePrintData: options?.invoicePrintData // Backward compatibility
    };

    return result;
  }


