import { CreditBankDetail, CreditChargeData, CreditNotePdfData } from "../interfaces/pdf-document.interfaces";
import { PdfTermItem } from '../interfaces/pdf-base.interface';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { buildTwoColumnInfo } from '../builders/pdf-table.builder';
import { buildTitle, buildSectionTitle, buildDivider, } from '../builders/pdf-section.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS } from '../styles/pdf-styles';
import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { Bold } from 'angular-feather/icons';

// HTML print logo uses 110px. pdfMake works in pt, so convert px -> pt (72/96).
const INVOICE_LOGO_HEIGHT_PX = 110;
const INVOICE_LOGO_HEIGHT_PT = INVOICE_LOGO_HEIGHT_PX * 0.75;

function isIndianCompany(data: CreditNotePdfData): boolean {
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

function estimateWrappedLineCount(text: string, charsPerLine: number): number {
  if (!text) {
    return 0;
  }

  return text
    .split(/\r?\n/)
    .reduce((count, line) => count + Math.max(1, Math.ceil((line || '').length / charsPerLine)), 0);
}

function pickFirstString(...values: any[]): string {
  const found = values.find(value => value !== null && value !== undefined && String(value).trim() !== '');
  return found === null || found === undefined ? '' : String(found);
}

export function generateCreditNoteDocument(data: CreditNotePdfData): any {
  // console.log(data, 'generateInvoiceDocument');
  const chargesCount = data.charges?.length || 0;
  const shouldBreakPageForTerms = chargesCount > 20;
  const resolvedTerms = getCreditNoteTerms(data);
  const isIndiaCompany = isIndianCompany(data);
  const printData = (data as any).creditNotePrintData;
  const logoHeaderHeight = INVOICE_LOGO_HEIGHT_PT;
  const baseTopMargin = 132;
  const extraTopMarginForLogo = Math.max(0, logoHeaderHeight - 55);
  const extraTopMarginForIndiaInfo = isIndiaCompany ? 12 : 0;
  const extraTopMarginForGstCode = isIndiaCompany && (printData?.GSTCode || data.companyGstCode) ? 6 : 0;
  const extraTopMarginForCreditInfo = isIndiaCompany ? 32 : 22;
  const billedTo = pickFirstString(printData?.BilledTo, printData?.PartyName, data.credit?.customerName);
  const billingAddress = pickFirstString(printData?.BillingAddress, printData?.PartyAddress, data.credit?.customerAddress);
  const billedToLines =
    estimateWrappedLineCount(billedTo, 34) +
    estimateWrappedLineCount(billingAddress, 52);
  const extraTopMarginForBilledTo = Math.max(0, billedToLines - 3) * 16;
  const dynamicTopMargin =
    baseTopMargin +
    extraTopMarginForLogo +
    extraTopMarginForIndiaInfo +
    extraTopMarginForGstCode +
    extraTopMarginForCreditInfo +
    extraTopMarginForBilledTo;
  const configuredMargins = data.config?.pageMargins as number[] | undefined;
  const resolvedPageMargins = configuredMargins
    ? [
      configuredMargins[0] ?? 20,
      Math.max(configuredMargins[1] ?? dynamicTopMargin, dynamicTopMargin),
      configuredMargins[2] ?? 20,
      configuredMargins[3] ?? 60
    ]
    : [20, dynamicTopMargin, 20, 60];
  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: [resolvedPageMargins[0], resolvedPageMargins[1], resolvedPageMargins[2], 30],

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
          buildCreditNoteHeader(data),
          buildCreditNoteTitle(data),
          buildCreditNoteInfo(data),


        ],
        margin: [20, 10, 20, 0] // Add margin to header content
      };
    },

    content: [
      // { text: '', margin: [0, 10, 0, 0] },   // Spacer to push content below header
      buildShipmentDetails(data),
      buildChargesTable(data),
      buildTotalsSection(data),
      buildAmountInWords(data),
      buildRemarks(data.credit?.remarks || ''),
      ...buildBankDetailsSection(data),
      ...(resolvedTerms.length > 0
        ? [
          // ...(shouldBreakPageForTerms ? [{ text: '', pageBreak: 'before' as const }] : []),
          buildTermsSectionWithBullets(resolvedTerms)
        ]
        : []),
      ...buildAuthorisedSignatory(data)
    ],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: `Printed By : ${data.userData?.userName || ''}`,
          fontSize: 7,
          alignment: 'left',
          width: '25%'
        },
        {
          text: 'This document is computer-generated and does not require a signature.',
          fontSize: 7,
          alignment: 'center',
          noWrap: true,
          width: '*'
        },
        {
          text: `Printed On : ${formatDate(new Date())}  Page: ${currentPage} of ${pageCount}`,
          fontSize: 7,
          alignment: 'right',
          width: '30%'
        }
      ],
      margin: [30, 0, 30, 0]
    }),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };

}

/**
  * Build creditnote header
  */

function buildCreditNoteHeader(data: CreditNotePdfData): any {
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

  const logoColumn = logo
    ? { image: logo, height: LOGO_HEIGHT, alignment: printSettings.logoPosition }
    : { text: '', width: 1 };

  const companyInfoStack: any[] = [];
  const companyAlignment = printSettings.companyAlignment;

  if (company?.companyName) {
    companyInfoStack.push({
      text: company.companyName.toUpperCase(),
      style: 'companyName',
      alignment: companyAlignment,
      margin: [0, 0, 0, 6]
    });
  }

  const branchName = branch?.branchName || (branch as any)?.BranchName || '';
  if (branchName) {
    companyInfoStack.push({
      text: branchName,
      style: 'branchName',
      bold: true,
      alignment: companyAlignment,
      margin: [0, 0, 0, 4]
    });
  }

  const cityName = branch?.cityMaster?.cityName || branch?.cityName || company?.city;
  const addressLine2 = branch?.addressLine2 || company?.addressLine2;
  const postalCode = branch?.postalCode || company?.postalCode;
  const phone = branch?.phoneNumber || company?.phoneNumber;
  const addressLine1 = branch?.addressLine1 || company?.addressLine1;
  if (addressLine1) {
    const hasMoreAddressDetails = !!(addressLine2 || cityName || postalCode || phone);
    companyInfoStack.push({
      text: isIndiaCompany && hasMoreAddressDetails ? `${addressLine1},` : addressLine1,
      style: 'addressText',
      alignment: companyAlignment,
      margin: [0, 0, 0, 6]
    });
  }

  const cityLine = buildCreditNoteHeaderDetailLine([
    { value: addressLine2 || '' },
    { value: cityName || '' },
    { label: 'Postal Code : ', value: postalCode || '' },
    { label: 'Ph.no : ', value: phone || '' }
  ]);
  if (cityLine.length) {
    companyInfoStack.push({
      text: cityLine,
      style: 'addressText',
      alignment: companyAlignment,
      margin: [0, 0, 0, 6]
    });
  }

  const companyTaxNo = isIndiaCompany
    ? data.companyGstCode || (branch as any)?.taxRegistrationNo || (company as any)?.GST_VAT || ''
    : data.companyPan || (data as any)?.companyVatNo || (company as any)?.Pan || (company as any)?.PAN || '';
  if (companyTaxNo) {
    companyInfoStack.push({
      text: `${isIndiaCompany ? 'GST No' : 'VAT No'} : ${companyTaxNo}`,
      style: 'addressText',
      alignment: companyAlignment
    });
  }

  const slotAlign: Record<'left' | 'center' | 'right', 'left' | 'center' | 'right'> = {
    left: 'left',
    center: 'center',
    right: 'right'
  };

  const buildSlot = (slot: 'left' | 'center' | 'right') => {
    const stack: any[] = [];
    if (printSettings.logoPosition === slot) {
      stack.push(logoColumn);
    }
    if (printSettings.companyPosition === slot) {
      const companyMargin = slot === 'right'
        ? (stack.length ? [0, 4, 18, 0] : [0, 0, 18, 0])
        : (stack.length ? [0, 4, 0, 0] : [0, 0, 0, 0]);
      stack.push({ stack: companyInfoStack, alignment: slotAlign[slot], margin: companyMargin });
    }
    return { stack };
  };

  const headerTable = {
    table: {
      widths: getCreditNoteHeaderWidths(printSettings.logoPosition, printSettings.companyPosition),
      body: [[buildSlot('left'), buildSlot('center'), buildSlot('right')]]
    },
    layout: 'noBorders',
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

function buildCreditNoteHeaderDetailLine(parts: Array<{ label?: string; value: string }>): any[] {
  return parts
    .filter(part => !!part.value)
    .flatMap((part, index) => [
      ...(index > 0 ? [{ text: ', ' }] : []),
      ...(part.label ? [{ text: part.label, bold: true }] : []),
      { text: part.value }
    ]);
}

function getCreditNoteHeaderWidths(
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
  * Build creditnoote title
  */
function buildCreditNoteTitle(data: CreditNotePdfData): any {
  const title = data.creditnoteTitle || 'CREDIT NOTE';

  return {
    stack: [
      {
        text: title,
        style: 'Credit Note',
        alignment: 'center',
        bold: true,
        fontSize: 12,
        margin: [0, 2, 0, 7]
      }
    ]
  };
}

/**
 * Build creditnote info section - using creditPrintData
 */
function buildCreditNoteInfo(data: CreditNotePdfData): any {
  const credit = data.credit;
  const printData = (data as any).creditNotePrintData;
  const isIndiaCompany = isIndianCompany(data);

  // ✅ FIX: Correct field name — printData uses 'GSTVAT' or 'GST_VAT'
  const gstVatNo =
    pickFirstString(
      printData?.GST_VAT,
      printData?.GSTVAT,
      printData?.GSTNo,
      printData?.CustomerGSTVAT,
      printData?.CustomerTaxNo,
      credit?.customerGstVat,
      (credit as any)?.GST_VAT
    );

  // ✅ FIX: All possible IRN field names
  const irnNumber =
    printData?.IRNNumber ||
    printData?.IRNNo ||
    printData?.IRN ||
    credit?.irnNumber ||
    (credit as any)?.IRNNumber ||
    (credit as any)?.IRNNo ||
    '';

  // ✅ FIX: Correct date field — was using wrong printData field
  const creditDate =
    printData?.CreditDate ||
    printData?.InvoiceDate ||
    printData?.VoucherDate ||
    credit?.invoiceDate ||
    '';

  const PAGE_LEFT = -10;
  const RIGHT_LABEL_WIDTH = 98;
  const COLON_WIDTH = 10;
  const BILLED_TO_INDENT = 30;

  const buildInfoRow = (label: string, value: string, marginBottom = 5): any => ({
    columns: [
      { text: label, width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH, alignment: 'center' },
      { text: value ?? '', width: '*', margin: [6, 0, 0, 0] }
    ],
    margin: [0, 0, 0, marginBottom]
  });

  // Left side
  const billedTo = pickFirstString(
    printData?.BilledTo,
    printData?.PartyName,
    credit?.customerName
  );
  const billingAddress = pickFirstString(
    printData?.BillingAddress,
    printData?.PartyAddress,
    credit?.customerAddress
  );

  const leftStack: any[] = [
    { text: 'BILLED TO', style: 'labelBold', margin: [0, 0, 0, 6] },
    { text: billedTo, margin: [BILLED_TO_INDENT, 0, 0, 6] }
  ];

  if (billingAddress) {
    leftStack.push({
      text: billingAddress,
      margin: [BILLED_TO_INDENT, 0, 0, 0],
      lineHeight: 1.2
    });
  }

  if (isIndiaCompany && (printData?.PAN || (data as any)?.companyPan)) {
    leftStack.push({
      columns: [
        { text: 'PAN', width: 28, style: 'labelBold' },
        { text: ':', width: COLON_WIDTH },
        { text: printData?.PAN || (data as any)?.companyPan || '', width: '*' }
      ],
      margin: [BILLED_TO_INDENT, 4, 0, 0]
    });
  }

  // ✅ Right side — build rows one by one clearly
  const rightStack: any[] = [];

  // Row 1: Credit No
  rightStack.push(
    buildInfoRow(
      'Credit No',
      pickFirstString(printData?.CreditNo, printData?.InvoiceNo, credit?.invoiceNo)
    )
  );

  // Row 2: Credit Date  ✅ FIX: use creditDate variable (not inline)
  rightStack.push(
    buildInfoRow(
      'Credit Date',
      creditDate ? formatDate(creditDate) : ''
    )
  );

  // Row 3 & 4: GST/IRN — ONLY for Indian companies
  if (isIndiaCompany) {
    rightStack.push(buildInfoRow('GST No.', gstVatNo, 7));
    rightStack.push(buildInfoRow('IRN No.', irnNumber, 7));
  } else {
    // Non-India: VAT No only
    rightStack.push(buildInfoRow('VAT No.', gstVatNo, 7));
  }

  // Remove bottom margin from last row
  if (rightStack.length > 0) {
    rightStack[rightStack.length - 1].margin = [0, 0, 0, 0];
  }

  const twoColumnLayout = {
    columns: [
      { width: '50%', stack: leftStack },
      { width: '50%', stack: rightStack }
    ],
    columnGap: 0,
    margin: [15, 4, 0, 0]
  };

  const bottomLine = {
    table: {
      widths: ['*'],
      body: [[{ text: '', border: [false, true, false, false], margin: [0, 0, 0, 0] }]]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0,
      hLineColor: () => '#000',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [PAGE_LEFT, 6, -10, 0]
  };

  return {
    stack: [twoColumnLayout, bottomLine],
    margin: [0, 0, 0, 0]
  };
}
/**
  * Build shipment details - using creditPrintData
  */
function buildShipmentDetails(data: CreditNotePdfData): any {
  const credit = data.credit;
  const printData = (data as any).creditNotePrintData; // need to change //
  const cargo = data.cargoDetails;
  const isSeaMode = data.isSeaMode !== false;

  const LEFT_LABEL_WIDTH = 88;
  const RIGHT_LABEL_WIDTH = 100;
  const COLON_WIDTH = 5;
  // Left Column
  const leftItems: { label: string; value: string }[] = [];

  leftItems.push({
    label: 'Shipper',
    value: printData?.ShipperName || credit?.shipperName || ''
  });

  leftItems.push({
    label: 'Consignee / Notify',
    value: printData?.ConsigneeName || credit?.consigneeName || ''
  });

  leftItems.push({
    label: isSeaMode ? 'Vessel Name' : 'Flight Name',
    value: printData?.Vessel || credit?.vesselName || ''
  });

  leftItems.push({
    label: isSeaMode ? 'Voyage No.' : 'Flight No.',
    value: printData?.VoyageNo || credit?.voyageNo || ''
  });

  leftItems.push({
    label: 'Shipper Ref No.',
    value: printData?.CustomerRefNo || credit?.shipperRefNo || ''
  });

  leftItems.push({
    label: 'Loading Port',
    value: printData?.POL || credit?.loadingPort || credit?.pol || ''
  });

  leftItems.push({
    label: 'Final Destination',
    value: printData?.FPD || credit?.finalDestination || credit?.fpd || ''
  });

  leftItems.push({
    label: 'ETD',
    value: printData?.ETD ? formatDate(printData.ETD) : formatDate(credit?.etd || '')
  });

  leftItems.push({
    label: 'ETA',
    value: printData?.ETA ? formatDate(printData.ETA) : formatDate(credit?.eta || '')
  });

  // Right Column
  const rightItems: { label: string; value: string }[] = [];

  rightItems.push({
    label: isSeaMode ? 'HBL' : 'HAWB',
    value: printData?.HBLNo || credit?.hblNo || ''
  });

  rightItems.push({
    label: isSeaMode ? 'MBL' : 'MAWB',
    value: printData?.MBLNo || credit?.mblNo || ''
  });

  rightItems.push({
    label: 'Job No.',
    value: printData?.MasterJobNumber || credit?.jobNo || ''
  });

  rightItems.push({
    label: 'Freight Terms',
    value: printData?.FreightTerms || credit?.freightTerms || ''
  });

  rightItems.push({
    label: 'Booking No.',
    value: printData?.BookingNumber || credit?.bookingNo || ''
  });

  const dueDate = printData?.InvoiceDueDate || credit?.invoiceDueDate || credit?.dueDate;
  rightItems.push({
    label: 'Invoice Due Date',
    value: dueDate ? formatDate(dueDate) : ''
  });

  const currExRate = printData?.CurrExRate ||
    (credit?.currencyCode && credit?.exchangeRate
      ? `${credit.currencyCode} / ${credit.exchangeRate}`
      : credit?.currencyCode || '');
  rightItems.push({ label: 'Currency / Ex-Rate', value: currExRate });


  // Build stacks
  const leftStack = leftItems.map(item => ({
    columns: [
      { text: item.label, width: LEFT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH },
      { text: item.value, width: '*', margin: [4, 0, 0, 0] }
    ],
    margin: [10, 3, 0, 3]
  }));


  const rightStack: any[] = rightItems.map(item => ({
    columns: [
      { text: item.label, width: RIGHT_LABEL_WIDTH, style: 'labelBold' },
      { text: ':', width: COLON_WIDTH },
      { text: item.value, width: '*', margin: [4, 0, 0, 0] }
    ],
    margin: [0, 3, 0, 3]
  }));

  // Cargo table
  if (printData || cargo) {
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
        widths: [30, '*', 55, 55],
        body: [
          [
            { text: 'Pkg', style: 'tableHeader', alignment: 'center' },
            { text: 'Commodity Desc', style: 'tableHeader', alignment: 'center' },
            { text: 'Gross Wt.', style: 'tableHeader', alignment: 'center' },
            { text: isSeaMode ? 'CBM' : 'Charge Wt.', style: 'tableHeader', alignment: 'center' }
          ],
          [
            { text: String(cargoData.packages), alignment: 'center' },
            { text: cargoData.desc },
            { text: formatNumberWithCommas(Number(cargoData.grosswt) || 0, 3), alignment: 'right' },
            {
              text: formatNumberWithCommas(
                Number(isSeaMode ? cargoData.cbm : cargoData.chargeableWeight) || 0,
                3
              ),
              alignment: 'right'
            }
          ]
        ]
      },
      layout: PDF_TABLE_LAYOUTS.bordered,
      margin: [0, 2, 0, 0]
    });
  }

  return {
    stack: [
      {
        table: {
          widths: ['50%', '50%'],
          body: [[
            { stack: leftStack, margin: [5, 0, 5, 2] },
            { stack: rightStack, margin: [5, 0, 5, 2] }
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
 * Build charges table - using creditPrintData.voucherDetails
 */
function buildChargesTable(data: CreditNotePdfData): any {
  const charges = data.charges || [];
  const printData = (data as any).creditNotePrintData; // need to change //
  const voucherDetails = printData?.voucherDetails || [];
  const isIndiaCompany = isIndianCompany(data);

  const taxConfig = data.taxDisplayConfig || {
    showCGST: false,
    showSGST: false,
    showIGST: false,
    showVAT: false
  };

  const localCurrency = data.localCurrency || 'AED';
  const creditCurr = data.credit?.currencyCode;
  const grandTotal = printData?.totalPartyAmount || data.totals?.grandTotal || 0;
  const hasForeignCurrencyColumn = !!(creditCurr && creditCurr !== localCurrency);

  const displayDetails = voucherDetails.length > 0 ? voucherDetails : charges;
  if (!displayDetails.length) return { text: '' };

  /* ---------------- COLUMN COUNT ---------------- */
  const totalColumns =
    7 +
    (isIndiaCompany ? 1 : 0) +
    (taxConfig.showCGST ? 2 : 0) +
    (taxConfig.showSGST ? 2 : 0) +
    (taxConfig.showIGST ? 2 : 0) +
    (taxConfig.showVAT ? 2 : 0) +
    (creditCurr && creditCurr !== localCurrency ? 1 : 0);

  const baseFontSize = totalColumns > 8 ? 9 : 12;
  const headerFontSize = baseFontSize;

  /* ---------------- HEADER ---------------- */
  const headerRow: any[] = [
    { text: 'S.No.', style: 'tableHeaderSmall', alignment: 'center' },
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

  if (taxConfig.showVAT) {
    headerRow.push(
      { text: 'VAT %', style: 'tableHeaderSmall', alignment: 'right' },
      { text: 'VAT Amt', style: 'tableHeaderSmall', alignment: 'right' }
    );
  }

  headerRow.push({
    text: `Amt In ${localCurrency}`,
    style: 'tableHeaderSmall',
    alignment: 'right'
  });

  if (creditCurr && creditCurr !== localCurrency) {
    headerRow.push({
      text: `Amt In ${creditCurr}`,
      style: 'tableHeaderSmall',
      alignment: 'right'
    });
  }

  /* ---------------- ROWS ---------------- */
  const dataRows = displayDetails.map((detail: any, index: number) => {
    const row: any[] = [
      { text: detail.Sno || index + 1, style: 'tableCellSmall', alignment: 'center' },
      { text: detail.ChargeDescription || detail.chargeName || '', style: 'tableCellSmall', noWrap: false },
      ...(isIndiaCompany
        ? [{
            text: detail.HSNCode || detail.HSNSAC || detail.hsnSacCode || '-',
            style: 'tableCellSmall',
            alignment: 'center'
          }]
        : []),
      { text: detail.CurrencyCode || detail.currencyCode || '', style: 'tableCellSmall', alignment: 'center' },
      { text: detail.NumberOfUnit || formatNumberWithCommas(detail.qty, 3), style: 'tableCellSmall', alignment: 'right' },
      { text: detail.Rate || formatNumberWithCommas(detail.rate, 3), style: 'tableCellSmall', alignment: 'right' },
      { text: detail.ExchangeRate || formatNumberWithCommas(detail.roe || 1, 4), style: 'tableCellSmall', alignment: 'right' },
      { text: detail.TaxableAmount || formatNumberWithCommas(detail.taxableAmount || detail.amount, 2), style: 'tableCellSmall', alignment: 'right' }
    ];

    if (taxConfig.showCGST) {
      row.push(
        { text: detail.cgstRate || formatNumberWithCommas(detail.cgstPercent, 2), style: 'tableCellSmall', alignment: 'right' },
        { text: detail.cgstAmt || formatNumberWithCommas(detail.cgstAmount, 2), style: 'tableCellSmall', alignment: 'right' }
      );
    }

    if (taxConfig.showSGST) {
      row.push(
        { text: detail.sgstRate || formatNumberWithCommas(detail.sgstPercent, 2), style: 'tableCellSmall', alignment: 'right' },
        { text: detail.sgstAmt || formatNumberWithCommas(detail.sgstAmount, 2), style: 'tableCellSmall', alignment: 'right' }
      );
    }

    if (taxConfig.showIGST) {
      row.push(
        { text: detail.igstRate || formatNumberWithCommas(detail.igstPercent, 2), style: 'tableCellSmall', alignment: 'right' },
        { text: detail.igstAmt || formatNumberWithCommas(detail.igstAmount, 2), style: 'tableCellSmall', alignment: 'right' }
      );
    }

    if (taxConfig.showVAT) {
      row.push(
        { text: detail.vatRate || formatNumberWithCommas(detail.vatPercent, 2), style: 'tableCellSmall', alignment: 'right' },
        { text: detail.vatAmt || formatNumberWithCommas(detail.vatAmount, 2), style: 'tableCellSmall', alignment: 'right' }
      );
    }

    row.push({
      text: detail.LocalAmount || formatNumberWithCommas(detail.localAmount, 2),
      style: 'tableCellSmall',
      alignment: 'right'
    });

    if (creditCurr && creditCurr !== localCurrency) {
      row.push({
        text: detail.PartyAmount || formatNumberWithCommas(detail.partyAmount, 2),
        style: 'tableCellSmall',
        alignment: 'right'
      });
    }

    return row;
  });

  /* ---------------- TOTAL ROW ---------------- */
  const totalRow: any[] = taxConfig.showVAT
    ? buildCreditNoteVatTotalRow(displayDetails, isIndiaCompany, hasForeignCurrencyColumn, grandTotal)
    : buildDefaultCreditNoteTotalRow(headerRow.length, grandTotal);

  /* ---------------- WIDTHS (FIXED + SAFE) ---------------- */
  const widths: (number | string)[] = [
    18,    // S.No
    '*',   // Particulars
    ...(isIndiaCompany ? [42] : []), // HSN/SAC
    22,    // Curr
    40,    // Qty
    36,    // Rate
    36,    // ROE
    46     // Taxable
  ];

  if (taxConfig.showCGST) widths.push(24, 38);
  if (taxConfig.showSGST) widths.push(24, 38);
  if (taxConfig.showIGST) widths.push(24, 38);
  if (taxConfig.showVAT) widths.push(24, 38);

  widths.push(48); // Amt in Local Currency

  if (hasForeignCurrencyColumn) {
    widths.push(48); // Amt in Party Currency
  }

  /* ---------------- RETURN ---------------- */
  return {
    table: {
      headerRows: 1,
      widths,
      body: [headerRow, ...dataRows, totalRow]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: (i: number, node: any) => {
        const last = node.table.widths.length;
        // Use the page border as the table's outer left/right edge.
        if (i === 0 || i === last) return 0;
        return 0.5;
      },
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3
    },
    margin: [-10, 0, -10, 2],
    style: { noWrap: false }
  };
}

/**
 * Build totals section
 */
function buildTotalsSection(data: CreditNotePdfData): any {
  return { text: '' };
}

function buildDefaultCreditNoteTotalRow(colCount: number, grandTotal: any): any[] {
  const totalRow: any[] = [];

  for (let i = 0; i < colCount - 2; i++) {
    totalRow.push({ text: '', style: 'tableCellSmall' });
  }

  totalRow.push({ text: 'Total', style: 'tableCellBoldSmall', alignment: 'right' });
  totalRow.push({ text: formatNumberWithCommas(parsePdfNumber(grandTotal), 2), style: 'tableCellBoldSmall', alignment: 'right' });

  return totalRow;
}

function buildCreditNoteVatTotalRow(
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

  totalRow.push({ text: 'Total', style: 'tableCellBoldSmall', alignment: 'right', noWrap: true });
  totalRow.push({
    text: formatNumberWithCommas(sumPdfDetailAmount(details, 'vatAmt', 'vatAmount'), 2),
    style: 'tableCellBoldSmall',
    alignment: 'right',
    noWrap: true
  });
  totalRow.push({
    text: hasForeignCurrencyColumn
      ? formatNumberWithCommas(sumPdfDetailAmount(details, 'LocalAmount', 'localAmount'), 2)
      : formatNumberWithCommas(parsePdfNumber(grandTotal), 2),
    style: 'tableCellBoldSmall',
    alignment: 'right',
    noWrap: true
  });

  if (hasForeignCurrencyColumn) {
    totalRow.push({
      text: formatNumberWithCommas(parsePdfNumber(grandTotal), 2),
      style: 'tableCellBoldSmall',
      alignment: 'right',
      noWrap: true
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

/**
  * Build amount in words
  */

function buildAmountInWords(data: CreditNotePdfData): any {
  const printData = (data as any).creditNotePrintData; // need to change //
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

function buildBankDetailsSection(data: CreditNotePdfData): any[] {
  const bankDetails = data.bankDetails || [];
  const isVATMode = data.isVATMode !== false;

  // Get just the currency code (e.g., USD, AED)
  const creditCurrency = data.credit?.currencyCode || '';
  const localCurrency = data.localCurrency || '';
  const currencyCode = creditCurrency || localCurrency;

  if (bankDetails.length === 0) return [];

  // Filter valid banks with at least one field populated
  const validBanks = bankDetails.filter(bank =>
    bank.beneficiaryName ||
    bank.accountNo ||
    bank.bankName ||
    bank.iban ||
    bank.ifscCode ||
    bank.swiftCode ||
    bank.bankAddress ||
    bank.branchName
  );

  if (validBanks.length === 0) return [];

  // Limit to maximum 3 banks to prevent overflow
  const banksToDisplay = validBanks.slice(0, 3);

  // Create header row
  const headers = [
    { text: 'Details', style: 'tableHeader', alignment: 'center' }
  ];

  // Add bank columns dynamically
  for (let i = 0; i < banksToDisplay.length; i++) {
    if (currencyCode) {
      headers.push({
        text: `Bank (${currencyCode})`,
        style: 'tableHeader',
        alignment: 'center'
      });
    } else {
      headers.push({
        text: `Bank ${i + 1}`,
        style: 'tableHeader',
        alignment: 'center'
      });
    }
  }

  const rows: any[] = [headers];

  // Beneficiary Name row
  const beneficiaryRow: any[] = [{
    text: 'Beneficiary Name',
    style: 'labelBold',
    alignment: 'left',
    fontSize: 8  // Reduced font size
  }];
  for (let i = 0; i < banksToDisplay.length; i++) {
    beneficiaryRow.push({
      text: banksToDisplay[i].beneficiaryName || '',
      alignment: 'left',
      noWrap: false,
      fontSize: 8  // Reduced font size
    });
  }
  rows.push(beneficiaryRow);

  // Account No. row
  const accountRow: any[] = [{
    text: 'Account No.',
    style: 'labelBold',
    alignment: 'left',
    fontSize: 8  // Reduced font size
  }];
  for (let i = 0; i < banksToDisplay.length; i++) {
    accountRow.push({
      text: banksToDisplay[i].accountNo || '',
      alignment: 'left',
      noWrap: false,
      fontSize: 8
    });
  }
  rows.push(accountRow);

  // IBAN/IFSC row
  const ibanRow: any[] = [{
    text: isVATMode ? 'IBAN' : 'IFSC Code',
    style: 'labelBold',
    alignment: 'left',
    fontSize: 8
  }];
  for (let i = 0; i < banksToDisplay.length; i++) {
    if (isVATMode) {
      ibanRow.push({
        text: banksToDisplay[i].iban || '',
        alignment: 'left',
        noWrap: false,
        fontSize: 8
      });
    } else {
      ibanRow.push({
        text: banksToDisplay[i].ifscCode || '',
        alignment: 'left',
        noWrap: false,
        fontSize: 8
      });
    }
  }
  rows.push(ibanRow);

  // Swift Code row
  const swiftRow: any[] = [{
    text: 'Swift Code',
    style: 'labelBold',
    alignment: 'left',
    fontSize: 8
  }];
  for (let i = 0; i < banksToDisplay.length; i++) {
    swiftRow.push({
      text: banksToDisplay[i].swiftCode || '',
      alignment: 'left',
      noWrap: false,
      fontSize: 8
    });
  }
  rows.push(swiftRow);

  // Bank Name row
  const bankNameRow: any[] = [{
    text: 'Bank Name',
    style: 'labelBold',
    alignment: 'left',
    fontSize: 8
  }];
  for (let i = 0; i < banksToDisplay.length; i++) {
    bankNameRow.push({
      text: banksToDisplay[i].bankName || '',
      alignment: 'left',
      noWrap: false,
      fontSize: 8
    });
  }
  rows.push(bankNameRow);

  // Branch row
  const branchRow: any[] = [{
    text: 'Branch',
    style: 'labelBold',
    alignment: 'left',
    fontSize: 8
  }];
  for (let i = 0; i < banksToDisplay.length; i++) {
    branchRow.push({
      text: banksToDisplay[i].bankAddress || banksToDisplay[i].branchName || '',
      alignment: 'left',
      noWrap: false,
      lineHeight: 1.1,
      fontSize: 8
    });
  }
  rows.push(branchRow);

  // Calculate column widths dynamically based on number of banks
  const TOTAL_WIDTH = 500; // Total available width (accounting for page margins)
  const DETAILS_COLUMN_WIDTH = 110;
  const REMAINING_WIDTH = TOTAL_WIDTH - DETAILS_COLUMN_WIDTH;
  const BANK_COLUMN_WIDTH = REMAINING_WIDTH / 3;

  const widths: (number | string)[] = [DETAILS_COLUMN_WIDTH];
  for (let i = 0; i < banksToDisplay.length; i++) {
    widths.push(BANK_COLUMN_WIDTH);
  }

  return [
    buildSectionTitle('Bank Details', { margin: [0, 10, 0, 3] }),
    {
      table: {
        headerRows: 1,
        widths: widths,
        body: rows,
        dontBreakRows: true
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 2,
        paddingBottom: () => 2
      },
      margin: [0, 0, 0, 5],
      style: { noWrap: false }
    }
  ];
}

/**
* Build terms section with bullet points
*/
function buildTermsSectionWithBullets(terms: (PdfTermItem | string)[]): any {
  if (!terms || terms.length === 0) {
    return { text: '' };
  }

  const termsList = terms.map((term) => {
    const content = typeof term === 'string' ? term : term.content;
    return content;
  });

  return {
    stack: [
      { text: 'Terms and Conditions', style: 'sectionTitle', margin: [0, 10, 0, 5] },
      {
        ul: termsList,
        margin: [0, 0, 0, 10]
      }
    ],
    margin: [0, 0, 0, 15]
  };
}

function getCreditNoteTerms(data: CreditNotePdfData): PdfTermItem[] {
  const companyMasterSid = Number((data.company as any)?.CompanyMasterSid || (data as any)?.companyMasterSid || 0);

  if (companyMasterSid === 13) {
    return [
      {
        content: 'If any discrepancy is noticed in the invoice, kindly inform us in writing within 7 days, otherwise the above amount will be considered as correct.'
      },
      {
        content: 'Please mention our invoice number(s) on your remittance instructions.'
      }
    ];
  }

  return (data.terms || []).filter((term) => {
    const content = typeof term === 'string' ? term : term?.content;
    return !!String(content || '').trim();
  }) as PdfTermItem[];
}


/**
 * Build authorised signatory
 */
function buildAuthorisedSignatory(data: CreditNotePdfData): any[] {
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
  * Transform API data to CreditPdfData format
  * IMPORTANT: This receives the RAW API data (creditData), not CreditPrintData
  */

export function transformCreditNoteApiData(
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
    creditNotePrintData?: any; // CRITICAL: The formatted print data
  }
): CreditNotePdfData {
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
    .map((detail: any, index: number): CreditChargeData => ({
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

  const subTotal = voucherDetails.reduce((sum: number, charge: CreditChargeData) => {
    const amount = charge.taxableAmount || charge.amount || 0;
    return charge.drCr === 'C' ? sum + amount : sum - amount;
  }, 0);

  const taxAmount = voucherDetails.reduce((sum: number, charge: CreditChargeData) => {
    const tax = (charge.cgstAmount || 0) + (charge.sgstAmount || 0) +
      (charge.igstAmount || 0) + (charge.vatAmount || 0);
    return sum + tax;
  }, 0);

  const grandTotal = voucherDetails.reduce((sum: number, charge: CreditChargeData) => {
    const amount = charge.partyAmount || charge.localAmount || charge.amount || 0;
    return charge.drCr === 'C' ? sum + amount : sum - amount;
  }, 0);

  const bankDetails: CreditBankDetail[] = (options?.bankDetails || []).map((bank: any) => ({
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
    content: term?.TandC || term?.Terms || term?.content || ''
  })).filter((term: PdfTermItem) => !!String(term.content || '').trim());

  const result: any = {
    company: {
      companyName: company?.companyName || '',
      CompanyMasterSid: company?.CompanyMasterSid,
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
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster
    },
    userData: {
      userName: userData?.userName || '',
      email: userData?.email || ''
    },
    logo,
    printSettings: options?.printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
    invoiceTitle: options?.invoiceTitle || 'Credit Note Invoice',
    companyGstCode: branch?.taxRegistrationNo || company?.GST_VAT || '',
    companyPan: company?.Pan || company?.PAN || '',
    credit: {
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
    cargoDetails: options?.cargoDetails,
    creditNotePrintData: options?.creditNotePrintData  // Pass through invoicePrintData
  };

  return result;
}
