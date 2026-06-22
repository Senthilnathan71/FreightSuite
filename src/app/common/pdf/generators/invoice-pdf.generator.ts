 
 
 /**
   * Invoice PDF Generator - COMPLETE CORRECTED VERSION
   * Generates Invoice PDFs matching HTML template exactly
   * Uses invoicePrintData for all display content
   */

  import { InvoicePdfData, InvoiceChargeData, InvoiceBankDetail } from '../interfaces/pdf-document.interfaces';
  import { PdfTermItem } from '../interfaces/pdf-base.interface';
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
  const INVOICE_LOGO_HEIGHT_PX = 90;
  const INVOICE_LOGO_HEIGHT_PT = INVOICE_LOGO_HEIGHT_PX * 0.75;

  function getContainerTypeNameFromList(containerTypeSid: number | string | null | undefined, containerTypes: any[] = []): string {
    if (!containerTypeSid || !Array.isArray(containerTypes) || !containerTypes.length) return '';

    const normalizedSid = Number(containerTypeSid);
    const match = containerTypes.find((item: any) =>
      Number(item?.ContainerTypeMasterSid ?? item?.ContainerTypeSid) === normalizedSid
    );

    return match?.ContainerName || match?.ContainerType || '';
  }

  function buildContainerDisplay(containers: any[] | null | undefined, containerTypes: any[] = []): string {
    if (!Array.isArray(containers) || !containers.length) return '';

    return containers
      .map((container: any) => {
        const containerNumber = container?.ContainerNumber || '';
        const containerType = getContainerTypeNameFromList(container?.ContainerType, containerTypes);

        if (containerNumber && containerType) {
          return `${containerNumber} / ${containerType}`;
        }

        return containerNumber || containerType || '';
      })
      .filter((value: string) => !!value)
      .join(', ');
  }

  function buildPdfLogoColumn(logo: string | null | undefined, height: number): any {
    if (!logo || logo === 'none') {
      return { text: '', width: 1 };
    }

    const fit: [number, number] = [105, height];

    if (logo.startsWith('data:image/svg+xml')) {
      const svgPayload = logo.split(',')[1] || '';
      const isBase64 = logo.includes(';base64,');
      const svg = isBase64 ? atob(svgPayload) : decodeURIComponent(svgPayload);
      return { svg, fit, alignment: 'left' as const };
    }

    return { image: logo, fit, alignment: 'left' as const };
  }
  /**
   * Generate invoice PDF document definition
   */
  export function generateInvoiceDocument(data: InvoicePdfData): any {
    console.log(data, 'generateInvoiceDocument');
    const chargesCount = data.charges?.length || 0;
    const shouldBreakPageForTerms = chargesCount > 20;
    const resolvedTerms = getInvoiceTerms(data);
    const printData = (data as any).invoicePrintData;
    const taxConfig = (data.taxDisplayConfig as any) || {};
    const isIndiaInvoice = isIndiaPdfInvoice(data, taxConfig);
    const isNonJobInvoice = isNonJobPdfInvoice(data);
    const billingAddressForHeader =
      printData?.BillingAddress ||
      data.invoice?.customerAddress ||
      '';
    const estimatedBillingAddressLines = Math.ceil(String(billingAddressForHeader).length / 58);
    const logoHeaderHeight = INVOICE_LOGO_HEIGHT_PT;
    const baseTopMargin = 138;
    const extraTopMarginForLogo = Math.max(0, logoHeaderHeight - 55);
    const extraTopMarginForIRNLine = isIndiaInvoice ? 14 : 0;
    const extraTopMarginForCustomerTaxLine = Math.min(
      Math.max(0, estimatedBillingAddressLines - 2) * 8,
      24
    ) + (!isIndiaInvoice ? 16 : 0);
    const extraTopMarginForIndiaFields =
      isIndiaInvoice
        ? ((printData?.PAN || (data as any)?.companyPan) ? 12 : 0)
        : 0;
    const extraTopMarginForVATLine = 0;
    const extraTopMarginForNonJobFields = isNonJobInvoice
      ? 24 + (printData?.InvoiceDueDate ? 12 : 0)
      : 0;
    const dynamicTopMargin = baseTopMargin + extraTopMarginForLogo + extraTopMarginForIndiaFields + extraTopMarginForIRNLine + extraTopMarginForCustomerTaxLine + extraTopMarginForVATLine + extraTopMarginForNonJobFields;
    const configuredMargins = data.config?.pageMargins as number[] | undefined;
    const resolvedPageMargins = configuredMargins
      ? [
          configuredMargins[0] ?? 20,
          Math.max(configuredMargins[1] ?? dynamicTopMargin, dynamicTopMargin),
          configuredMargins[2] ?? 20,
          Math.max(configuredMargins[3] ?? 42, 42)
        ]
      : [20, dynamicTopMargin, 20, 42];

    return {
      pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
      pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
      pageMargins: resolvedPageMargins,

      background: function (currentPage, pageSize) {
        
        return {
          canvas: [
            // LEFT BORDER
            { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.5 },
            // RIGHT BORDER
            { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.5 },
            // TOP BORDER
            { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.5 },
            // BOTTOM BORDER
            { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.5 }
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
        ...(isNonJobInvoice ? [] : [buildShipmentDetails(data)]),
        buildChargesTable(data),
        buildTotalsSection(data),
        buildAmountInWords(data),
        ...(data.invoice?.remarks ? [buildRemarks(data.invoice.remarks)] : []),
        ...(!isNonJobInvoice && buildContainerDetails(data) ? [buildContainerDetails(data)] : []),
        ...buildBankDetailsSection(data),
        ...(resolvedTerms.length > 0
  ? [
      buildTermsSectionWithBullets(resolvedTerms)
    ]
  : []),
        ...buildAuthorisedSignatory(data)
      ],
      footer: (currentPage: number, pageCount: number) => buildInvoiceFooter(data, currentPage, pageCount),
      styles: getPdfStyles(),
      defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
    };
    
  }

  function buildInvoiceFooter(data: InvoicePdfData, currentPage: number, pageCount: number): any {
    return {
      margin: [24, 22, 24, 0],
      columns: [
        { text: `Printed By : ${data.userData?.userName || ''}`, alignment: 'left', width: '25%', fontSize: 7, noWrap: true },
        {
          text: 'This document is computer-generated and does not require a signature.',
          alignment: 'center',
          width: '*',
          fontSize: 7,
          noWrap: true
        },
        {
          text: `Printed On : ${formatDate(new Date())}  Page: ${currentPage} of ${pageCount}`,
          alignment: 'right',
          width: '30%',
          fontSize: 7,
          noWrap: true
        }
      ]
    };
  }

  function buildContentDivider(): any {
    return {
      canvas: [{
        type: 'line',
        x1: -10,
        y1: 0,
        x2: 565,
        y2: 0,
        lineWidth: 0.5
      }],
      margin: [0, 6, 0, 4]
    };
  }


  /**
   * Build invoice header
   */
  
  function buildInvoiceHeader(data: InvoicePdfData): any {
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
    const companyCountryCode = String((data as any)?.companyCountryCode || company?.countryCode || branch?.countryCode || '').toLowerCase();
    const addressLine1 = branch?.addressLine1 || company?.addressLine1;
    if (addressLine1) {
      const hasMoreAddressDetails = !!(addressLine2 || cityName || postalCode || phone);
      companyInfoStack.push({
        text: companyCountryCode === 'in' && hasMoreAddressDetails ? `${addressLine1},` : addressLine1,
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

    const registrationNo = (
      companyCountryCode === 'in'
        ? data.companyGstCode || (branch as any)?.taxRegistrationNo || (company as any)?.GST_VAT
        : data.companyPan || (data as any)?.companyVatNo || (company as any)?.Pan || (company as any)?.PAN || (company as any)?.GST_VAT || (branch as any)?.taxRegistrationNo
    ) || '';
    if (companyCountryCode !== 'in' || registrationNo) {
      companyInfoStack.push({
        text: `${companyCountryCode === 'in' ? 'GST No' : 'VAT No'} : ${registrationNo}`,
        style: 'addressText',
        alignment: printSettings.companyAlignment
      });
    }

    const slotAlign: Record<'left' | 'center' | 'right', 'left' | 'center' | 'right'> = {
      left: 'left',
      center: 'center',
      right: 'right'
    };

    const buildLogo = (slot: 'left' | 'center' | 'right'): any => {
      const logoColumn = buildPdfLogoColumn(logo, LOGO_HEIGHT);
      return {
        ...logoColumn,
        alignment: slotAlign[slot],
        margin: slot === 'right' ? [0, 0, 10, 0] : slot === 'left' ? [8, 0, 0, 0] : [0, 0, 0, 0]
      };
    };

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
        widths: getInvoiceHeaderWidths(printSettings.logoPosition, printSettings.companyPosition),
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

  function getInvoiceHeaderWidths(
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
  function buildInvoiceTitle(data: InvoicePdfData): any {
    const title = data.invoiceTitle ||
      (data.invoice?.postStatus === 'P' ? 'TAX INVOICE' : 'TAX INVOICE DRAFT');
    const printData = (data as any).invoicePrintData;
    return {
      stack: [
        {
          text: title,
          style: 'Tax Invoice',
          alignment: 'center',
          bold: true,
          fontSize: 12,
          margin: [0, 0, 0, 0]
        },
      ],
      margin: [0, 0, 0, 0]
    };
  }

  /**
   * Build invoice info section - using invoicePrintData
   */
  function buildInvoiceInfo(data: InvoicePdfData): any {
  const invoice = data.invoice;
  const printData = (data as any).invoicePrintData;
  const taxConfig = (data.taxDisplayConfig as any) || {};
  const isIndiaInvoice = isIndiaPdfInvoice(data, taxConfig);
  const isNonJobInvoice = isNonJobPdfInvoice(data);
  const customerCountryCode = String(printData?.CustomerCountryCode || '')
    .trim()
    .toLowerCase();
  const customerTaxLabel = customerCountryCode === 'in' ? 'GST No.' : 'VAT No.';

  if (isNonJobInvoice) {
    return buildNonJobInvoiceInfo(data, isIndiaInvoice, customerTaxLabel);
  }

  const PAGE_LEFT = -10;
  const PAGE_RIGHT = 565;
  const RIGHT_LABEL_WIDTH = isNonJobInvoice ? 112 : 92;
  const COLON_WIDTH = 6;
  const LEFT_LABEL_WIDTH = 68;

  // -----------------------------
  // Left side - Billed To
  // -----------------------------
  const billedTo =
    printData?.BilledTo || invoice?.customerName || '';
  const billingAddress =
    printData?.BillingAddress || invoice?.customerAddress || '';
  const customerTaxNo =
    printData?.GST_VAT ||
    printData?.customerGstVat ||
    printData?.CustomerGSTVAT ||
    printData?.CustomerTaxNo ||
    invoice?.customerGstVat ||
    (invoice as any)?.GST_VAT ||
    '';

  const leftStack: any[] = [
    {
      text: 'Billed To',
      style: 'labelBold',
      margin: [0, 0, 0, 3]
    },
    {
      text: billedTo,
      margin: [10, 0, 0, 3]
    }
  ];

  if (billingAddress) {
    leftStack.push({
      text: billingAddress,
      margin: [10, 0, 0, 3]
    });
  }

  // if (isIndiaInvoice && (printData?.PAN || (data as any)?.companyPan)) {
  //   const customerCountryCode = String(printData?.CustomerCountryCode || '')
  //     .trim()
  //     .toLowerCase();
  //   const billedToTaxLabel = customerCountryCode === 'ae'
  //     ? 'VAT'
  //     : customerCountryCode === 'in'
  //       ? 'PAN'
  //       : 'Tax No';
  //   const billedToTaxLabelWidth = 25;

  //   leftStack.push({
  //     columns: [
  //       { text: billedToTaxLabel, width: billedToTaxLabelWidth, style: 'labelBold', noWrap: true },
  //       { text: ':', width: COLON_WIDTH, alignment: 'center' },
  //       { text: printData?.PAN || (data as any)?.companyPan || '', width: '*' }
  //     ],
  //     margin: [0, 6, 0, 0]
  //   });
  // }

  leftStack.push({
    columns: [
      { text: customerTaxLabel, width: 40, style: 'labelBold', noWrap: true },
      { text: ':', width: COLON_WIDTH, alignment: 'center', margin: [0, 1, 0, 0] },
      { text: customerTaxNo, width: '*', margin: [4, 1, 0, 0] }
    ],
    margin: [0, 6, 0, 0]
  });

  // -----------------------------
  // Right side - Invoice Details
  // -----------------------------
  const rightStack: any[] = [];

  // Invoice No
  rightStack.push({
    columns: [
      { text: 'Invoice No', width: RIGHT_LABEL_WIDTH, style: 'labelBold', noWrap: true },
      { text: ':', width: COLON_WIDTH, alignment: 'center' },
      { text: printData?.InvoiceNo || invoice?.invoiceNo || '', width: '*', margin: [4, 0, 0, 0] }
    ],
    margin: [0, 0, 0, 5]
  });

  // Invoice Date
  rightStack.push({
    columns: [
      { text: 'Invoice Date', width: RIGHT_LABEL_WIDTH, style: 'labelBold', noWrap: true },
      { text: ':', width: COLON_WIDTH, alignment: 'center' },
      {
        text: printData?.InvoiceDate
          ? formatDate(printData.InvoiceDate)
          : formatDate(invoice?.invoiceDate),
        width: '*',
        margin: [4, 0, 0, 0]
      }
    ],
    margin: [0, 0, 0, 5]
  });

  if (isNonJobInvoice) {
    const dueDate = printData?.InvoiceDueDate || invoice?.invoiceDueDate || invoice?.dueDate;
    if (dueDate) {
      rightStack.push({
        columns: [
          { text: 'Invoice Due Date', width: RIGHT_LABEL_WIDTH, style: 'labelBold', noWrap: true },
          { text: ':', width: COLON_WIDTH, alignment: 'center' },
          { text: dueDate === 'Cash Invoice' ? 'Cash Invoice' : formatDate(dueDate), width: '*' }
        ],
        margin: [0, 0, 0, 5]
      });
    }

    rightStack.push({
      columns: [
        { text: 'Currency / Ex-Rate', width: RIGHT_LABEL_WIDTH, style: 'labelBold', noWrap: true },
        { text: ':', width: COLON_WIDTH, alignment: 'center' },
        {
          text: printData?.CurrExRate ||
            (invoice?.currencyCode && invoice?.exchangeRate
              ? `${invoice.currencyCode} / ${invoice.exchangeRate}`
              : invoice?.currencyCode || ''),
          width: '*'
        }
      ],
      margin: [0, 0, 0, 5]
    });
  }

  if (isIndiaInvoice) {
    //  rightStack.push({
    //   columns: [
    //     { text: customerTaxLabel, width: RIGHT_LABEL_WIDTH, style: 'labelBold', noWrap: true },
    //     { text: ':', width: COLON_WIDTH, alignment: 'center' },
    //     { text: printData?.customerGstVat || invoice?.customerGstVat || '', width: '*', margin: [4, 0, 0, 0] }
    //   ],
    //   margin: [0, 0, 0, 7]
    // });
    if (customerCountryCode === 'in') {
      // IRN Number - show the label even when the customer country is India
      rightStack.push({
        columns: [
          { text: 'IRN No.', width: RIGHT_LABEL_WIDTH, style: 'labelBold', noWrap: true },
          { text: ':', width: COLON_WIDTH, alignment: 'center' },
          { text: printData?.IRNNumber || invoice?.irnNumber || '', width: '*', margin: [4, 0, 0, 0] }
        ],
        margin: [0, 0, 0, 7]
      });
    }
  }

  // 🔥 Remove bottom margin from the LAST row automatically
  if (rightStack.length > 0) {
    rightStack[rightStack.length - 1].margin = [0, 0, 0, 0];
  }

  // -----------------------------
  // Two Column Layout
  // -----------------------------
  const twoColumnLayout = {
    columns: [
      {
        width: '50%',
        stack: leftStack
      },
      {
        width: '50%',
        stack: rightStack,
        margin: [20, 4, 0, 4]
      }
    ],
    columnGap: 0,
    margin: [0, 0, 0, 0]
  };

  // -----------------------------
  // Bottom Line (No Extra Space)
  // -----------------------------
  const bottomLine = {
    canvas: [
      {
        type: 'line',
        x1: PAGE_LEFT,
        y1: 0,
        x2: PAGE_RIGHT,
        y2: 0,
        lineWidth: 0.5
      }
    ],
    margin: [0, isIndiaInvoice ? 10 : 6, 0, 3]
  };

  return {
    stack: [
      twoColumnLayout,
      bottomLine
    ],
    margin: [0, 0, 0, 4]
  };
}

function buildNonJobInvoiceInfo(data: InvoicePdfData, isIndiaInvoice: boolean, customerTaxLabel: string): any {
  const invoice = data.invoice;
  const printData = (data as any).invoicePrintData || {};
  const billedTo = printData?.BilledTo || invoice?.customerName || '';
  const billingAddress = printData?.BillingAddress || invoice?.customerAddress || '';
  const dueDate = printData?.InvoiceDueDate || invoice?.invoiceDueDate || invoice?.dueDate || '';
  const currExRate =
    printData?.CurrExRate ||
    (invoice?.currencyCode && invoice?.exchangeRate
      ? `${invoice.currencyCode} / ${invoice.exchangeRate}`
      : invoice?.currencyCode || '');
  const customerTaxNo =
    printData?.GST_VAT ||
    printData?.customerGstVat ||
    printData?.CustomerGSTVAT ||
    printData?.CustomerTaxNo ||
    invoice?.customerGstVat ||
    (invoice as any)?.GST_VAT ||
    '';

  const leftStack: any[] = [
    { text: 'Billed To', style: 'labelBold', margin: [0, 0, 0, 3] },
    { text: billedTo, margin: [0, 0, 0, 3] }
  ];

  if (billingAddress) {
    leftStack.push({ text: billingAddress, margin: [0, 0, 0, 3] });
  }

  if (isIndiaInvoice && (printData?.PAN || (data as any)?.companyPan)) {
    const customerCountryCode = String(printData?.CustomerCountryCode || '').trim().toLowerCase();
    leftStack.push({
      table: {
        widths: [88, 6, '*'],
        body: [[
          {
            text: customerCountryCode === 'ae' ? 'VAT' : customerCountryCode === 'in' ? 'PAN No' : 'Tax No',
            style: 'labelBold'
          },
          { text: ':' },
          { text: printData?.PAN || (data as any)?.companyPan || '' }
        ]]
      },
      layout: 'noBorders'
    });
  }

  const rightRows: any[] = [
    ['Invoice No.', printData?.InvoiceNo || invoice?.invoiceNo || ''],
    ['Invoice Date', printData?.InvoiceDate ? formatDate(printData.InvoiceDate) : formatDate(invoice?.invoiceDate)]
  ];

  if (dueDate) {
    rightRows.push([
      'Invoice Due Date',
      dueDate === 'Cash Invoice' ? 'Cash Invoice' : formatDate(dueDate)
    ]);
  }

  rightRows.push(
    ['Currency / Ex-Rate', currExRate],
    [isIndiaInvoice ? 'GST No.' : customerTaxLabel, customerTaxNo]
  );

  if (String(printData?.CustomerCountryCode || '').trim().toLowerCase() === 'in') {
    rightRows.push(['IRN No.', printData?.IRNNumber || invoice?.irnNumber || '']);
  }

  const rightTable = {
    table: {
      widths: [110, 6, '*'],
      body: rightRows.map(([label, value]) => [
        { text: label, style: 'labelBold', noWrap: true },
        { text: ':' },
        { text: value || '', noWrap: false }
      ])
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 1,
      paddingBottom: () => 2
    }
  };

  return {
    columns: [
      { width: '48%', stack: leftStack },
      { width: '52%', stack: [rightTable] }
    ],
    columnGap: 10,
    margin: [15, 0, 0, 0]
  };
}


  /**
   * Build shipment details - using invoicePrintData
   */
 function buildShipmentDetails(data: InvoicePdfData): any {
  const invoice = data.invoice;
  const printData = (data as any).invoicePrintData;
  const cargo = data.cargoDetails;
  const isSeaMode = data.isSeaMode !== false;
  const PAGE_LEFT = -10;
  const PAGE_RIGHT = 565;
  const companyCountry = String((data as any)?.companyCountryCode || getNormalizedCompanyCountry(data))
    .trim()
    .toLowerCase();
  const isUAECompany = companyCountry === 'ae' || companyCountry === 'uae' || companyCountry === 'dubai';

  const LEFT_LABEL_WIDTH = 88;
  const RIGHT_LABEL_WIDTH = 92;
  const COLON_WIDTH = 6;
  const vesselValue = printData?.Vessel || invoice?.vesselName || '';
  const voyageValue = printData?.VoyageNo || invoice?.voyageNo || '';
  const etdValue = printData?.ETD ? formatDate(printData.ETD) : formatDate(invoice?.etd || '');
  const etaValue = printData?.ETA ? formatDate(printData.ETA) : formatDate(invoice?.eta || '');

  // -----------------------------
  // Left Column Data
  // -----------------------------
  const leftItems: { label: string; value: string }[] = [
    { label: 'Shipper', value: printData?.ShipperName || invoice?.shipperName || '' },
    { label: 'Consignee / Notify', value: printData?.ConsigneeName || invoice?.consigneeName || '' },
    {
      label: `${isSeaMode ? 'Vsl Name' : 'Flight Name'} / ${isSeaMode ? 'Voy No.' : 'No.'}`,
      value: `${vesselValue}${vesselValue && voyageValue ? '/' : ''}${voyageValue}`
    },
    { label: 'Ref No.', value: printData?.DocumentNumber || invoice?.shipperRefNo || '' },
    { label: 'Loading Port', value: printData?.POL || invoice?.loadingPort || invoice?.pol || '' },
    { label: 'Final Destination', value: printData?.FPD || invoice?.finalDestination || invoice?.fpd || '' },
    {
      label: 'ETD / ETA',
      value: `${etdValue}${etdValue && etaValue ? ' / ' : ''}${etaValue}`
    },
    ...(isUAECompany
      ? [
          { label: 'BOE No.', value: printData?.BOENo || '' },
          { label: 'Declaration No.', value: printData?.DeclarationNo || printData?.declarationNo || '' }
        ]
      : [])
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
    ...(printData?.IsServiceJob !== 'Y' && printData?.JobType !== 'Agent'
  ? [{
      label: isSeaMode ? 'HBL' : 'HAWB',
      value: printData?.HBLNo || invoice?.hblNo || ''
    }]
  : []),
    ...(printData?.IsServiceJob !== 'Y'
  ? [{
      label: isSeaMode ? 'MBL' : 'MAWB',
      value: printData?.MBLNo || invoice?.mblNo || ''
    }]
    : []),
      { label: 'Job No.', value: printData?.MasterJobNumber || invoice?.jobNo || '' },
      { label: 'Freight Terms', value: printData?.FreightTerms || invoice?.freightTerms || '' },
      { label: 'Booking No.', value: printData?.BookingNumber || invoice?.bookingNo || '' },
      { label: 'Invoice Due Date', value: dueDate === 'Cash Invoice' ? 'Cash Invoice' : (dueDate ? formatDate(dueDate) : '') },
      { label: 'Currency / Ex-Rate', value: currExRate }
    ];

  // -----------------------------
  // Build Left Stack
  // -----------------------------
  const leftStack = leftItems.map(item => ({
    columns: [
      { text: item.label, width: LEFT_LABEL_WIDTH, style: 'labelBold', noWrap: true },
      { text: ':', width: COLON_WIDTH, alignment: 'center' },
      { text: item.value, width: '*', margin: [4, 0, 0, 0] }
    ],
    margin: [0, 3, 0, 5]
  }));

  // -----------------------------
  // Build Right Stack
  // -----------------------------
  const rightStack: any[] = rightItems.map(item => ({
    columns: [
      { text: item.label, width: RIGHT_LABEL_WIDTH, style: 'labelBold', noWrap: true },
      { text: ':', width: COLON_WIDTH, alignment: 'center' },
      { text: item.value, width: '*', margin: [4, 0, 0, 0] }
    ],
    margin: [0, 3, 0, 5]
  }));

  // -----------------------------
  // Cargo Table (Optional)
  // -----------------------------
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
        widths: [22, '*', 55, 55],
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
      margin: [0, 4, 0, 0]
    });
  }

  // -----------------------------
  // Final Layout
  // -----------------------------
  const detailsTable = {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: leftStack, margin: [0, 2, 5, 2] },
        // Keep right edge flush so cargo table aligns with charges table below.
        { stack: rightStack, margin: [15, 2, 0, 2] }
      ]]
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 0]
  };

  return {
    stack: [
      detailsTable
    ],
    margin: [0, 0, 0, 0]
  };
}

  /**
   * Build charges table - using invoicePrintData.voucherDetails
   */
  function buildChargesTable(data: InvoicePdfData): any {
    const charges = data.charges || [];
    const printData = (data as any).invoicePrintData;
    const voucherDetails = printData?.voucherDetails || [];

    const taxConfig = (data.taxDisplayConfig as any) || {
      showCGST: false,
      showSGST: false,
      showUGST: false,
      showIGST: false,
      showVAT: false
    };
    const isIndiaInvoice = !taxConfig.showVAT;
    const showHsnSac = isIndiaInvoice;

    const localCurrency = data.localCurrency || 'AED';
    const invoiceCurr = data.invoice?.currencyCode;
    const grandTotal = printData?.totalPartyAmount || data.totals?.grandTotal || 0;

    const displayDetails = voucherDetails.length > 0 ? voucherDetails : charges;

    const softenLongTokens = (value: any): string => {
      const input = String(value || '');
      if (!input) return '';

      // Let pdfMake wrap after common separators and inside very long unbroken tokens.
      const withBreakableSeparators = input
        .replace(/,/g, ',\u200B')
        .replace(/\//g, '/\u200B')
        .replace(/-/g, '-\u200B');

      return withBreakableSeparators.replace(/([^\s\u200B]{14})(?=[^\s\u200B])/g, '$1\u200B');
    };
    if (!displayDetails.length) return { text: '' };
    const compactBorderedLayout = {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 1,
      paddingRight: () => 1,
      paddingTop: () => 1,
      paddingBottom: () => 1
    };

    /* ---------------- COLUMN COUNT ---------------- */
    const totalColumns =
      7 +
      (showHsnSac ? 1 : 0) +
      (taxConfig.showCGST ? 2 : 0) +
      (taxConfig.showSGST ? 2 : 0) +
      (taxConfig.showUGST ? 2 : 0) +
      (taxConfig.showIGST ? 2 : 0) +
      (taxConfig.showVAT ? 2 : 0) +
      (invoiceCurr && invoiceCurr !== localCurrency ? 1 : 0);

    const hasForeignCurrencyColumn = !!(invoiceCurr && invoiceCurr !== localCurrency);
    const compactMode = totalColumns >= 12 || (isIndiaInvoice && hasForeignCurrencyColumn);

    /* ---------------- HEADER ---------------- */
    const headerRow: any[] = [
      { text: 'S.No.', style: 'tableHeaderSmall', alignment: 'center', noWrap: true },
      { text: 'Particulars', style: 'tableHeaderSmall',alignment:'center'},
      ...(showHsnSac ? [{ text: 'HSN/SAC', style: 'tableHeaderSmall', alignment: 'center', noWrap: true }] : []),
      { text: 'Curr.', style: 'tableHeaderSmall', alignment: 'center' },
      { text: 'No. of Unit', style: 'tableHeaderSmall', alignment: 'center', noWrap: true },
      { text: 'Rate', style: 'tableHeaderSmall', alignment: 'center' },
      { text: 'ROE', style: 'tableHeaderSmall', alignment: 'center' },
      { text: 'Taxable Amt', style: 'tableHeaderSmall', alignment: 'center', noWrap: true }
    ];

    if (taxConfig.showCGST) {
      headerRow.push(
        { text: 'CGST %', style: 'tableHeaderSmall', alignment: 'right', noWrap: true },
        { text: 'CGST Amt', style: 'tableHeaderSmall', alignment: 'right', noWrap: true }
      );
    }

    if (taxConfig.showSGST) {
      headerRow.push(
        { text: 'SGST %', style: 'tableHeaderSmall', alignment: 'right', noWrap: true },
        { text: 'SGST Amt', style: 'tableHeaderSmall', alignment: 'right', noWrap: true }
      );
    }

    if (taxConfig.showUGST) {
      headerRow.push(
        { text: 'UGST %', style: 'tableHeaderSmall', alignment: 'right', noWrap: true },
        { text: 'UGST Amt', style: 'tableHeaderSmall', alignment: 'right', noWrap: true }
      );
    }

    if (taxConfig.showIGST) {
      headerRow.push(
        { text: 'IGST %', style: 'tableHeaderSmall', alignment: 'right', noWrap: true },
        { text: 'IGST Amt', style: 'tableHeaderSmall', alignment: 'right', noWrap: true }
      );
    }

    if (taxConfig.showVAT) {
      headerRow.push(
        { text: 'VAT %', style: 'tableHeaderSmall', alignment: 'right', noWrap: true },
        { text: 'VAT Amt', style: 'tableHeaderSmall', alignment: 'right', noWrap: true }
      );
    }

    headerRow.push({
      text: `Amt In ${localCurrency}`,
      style: 'tableHeaderSmall',
      alignment: 'right',
      noWrap: true
    });

    if (invoiceCurr && invoiceCurr !== localCurrency) {
      headerRow.push({
        text: `Amt In ${invoiceCurr}`,
        style: 'tableHeaderSmall',
        alignment: 'right',
        noWrap: true
      });
    }

    /* ---------------- ROWS ---------------- */
    const dataRows = displayDetails.map((detail: any, index: number) => {
      const row: any[] = [
        { text: detail.Sno || index + 1, style: 'tableCellSmall', alignment: 'center' },
        {
          text: softenLongTokens(detail.ChargeDescription || detail.chargeName || ''),
          style: 'tableCellSmall',
          noWrap: false,
          lineHeight: 1.1
        },
        ...(showHsnSac ? [{ text: detail.HSSACCode || detail.hsnSacCode || '', style: 'tableCellSmall', alignment: 'center' }] : []),
        { text: detail.CurrencyCode || detail.currencyCode || '', style: 'tableCellSmall', alignment: 'center' },
        { text: detail.NumberOfUnit || formatNumberWithCommas(detail.qty, 3), style: 'tableCellSmall', alignment: 'right', noWrap: true },
        { text: detail.Rate || formatNumberWithCommas(detail.rate, 3), style: 'tableCellSmall', alignment: 'right', noWrap: true },
        { text: detail.ExchangeRate || formatNumberWithCommas(detail.roe || 1, 4), style: 'tableCellSmall', alignment: 'right', noWrap: true },
        { text: detail.TaxableAmount || formatNumberWithCommas(detail.taxableAmount || detail.amount, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true }
      ];

      if (taxConfig.showCGST) {
        row.push(
          { text: detail.cgstRate || formatNumberWithCommas(detail.cgstPercent, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true },
          { text: detail.cgstAmt || formatNumberWithCommas(detail.cgstAmount, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true }
        );
      }

      if (taxConfig.showSGST) {
        row.push(
          { text: detail.sgstRate || formatNumberWithCommas(detail.sgstPercent, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true },
          { text: detail.sgstAmt || formatNumberWithCommas(detail.sgstAmount, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true }
        );
      }

      if (taxConfig.showUGST) {
        row.push(
          { text: detail.ugstRate || formatNumberWithCommas(detail.ugstPercent, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true },
          { text: detail.ugstAmt || formatNumberWithCommas(detail.ugstAmount, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true }
        );
      }

      if (taxConfig.showIGST) {
        row.push(
          { text: detail.igstRate || formatNumberWithCommas(detail.igstPercent, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true },
          { text: detail.igstAmt || formatNumberWithCommas(detail.igstAmount, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true }
        );
      }

      if (taxConfig.showVAT) {
        row.push(
          { text: detail.vatRate || formatNumberWithCommas(detail.vatPercent, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true },
          { text: detail.vatAmt || formatNumberWithCommas(detail.vatAmount, 2), style: 'tableCellSmall', alignment: 'right', noWrap: true }
        );
      }

      row.push({
        text: detail.LocalAmount || formatNumberWithCommas(detail.localAmount, 2),
        style: 'tableCellSmall',
        alignment: 'right',
        noWrap: true
      });

      if (invoiceCurr && invoiceCurr !== localCurrency) {
        row.push({
          text: detail.PartyAmount || formatNumberWithCommas(detail.partyAmount, 2),
          style: 'tableCellSmall',
          alignment: 'right',
          noWrap: true
        });
      }

      return row;
    });

    /* ---------------- TOTAL ROW ---------------- */
    const totalRow: any[] = taxConfig.showCGST && taxConfig.showSGST
      ? buildIndiaGstTotalRow(displayDetails, showHsnSac, hasForeignCurrencyColumn, grandTotal)
      : taxConfig.showVAT
        ? buildVatTotalRow(displayDetails, showHsnSac, hasForeignCurrencyColumn, grandTotal)
        : buildInvoicePrintStyleTotalRow(headerRow.length, grandTotal);

    /* ---------------- WIDTHS (FIXED + SAFE) ---------------- */
    const widths: (number | string)[] = compactMode
      ? [
          18,    // S.No
          '*',   // Particulars - stretches compact invoice tables to full page width
          ...(showHsnSac ? [hasForeignCurrencyColumn ? 36 : 34] : []),
          21,    // Curr
          hasForeignCurrencyColumn ? 46 : 42,    // Qty
          hasForeignCurrencyColumn ? 38 : 42,    // Rate
          hasForeignCurrencyColumn ? 34 : 32,    // ROE
          hasForeignCurrencyColumn ? 52 : 52     // Taxable
        ]
      : [
          16,    // S.No
          '*',   // Particulars
          ...(showHsnSac ? [42] : []),
          21,    // Curr
          56,    // Qty
          34,    // Rate
          34,    // ROE
          58     // Taxable
        ];

    const taxAmountColumnWidth = hasForeignCurrencyColumn ? 36 : 40;
    if (taxConfig.showCGST) widths.push(...(compactMode ? [28, 48] : [34, 50]));
    if (taxConfig.showSGST) widths.push(...(compactMode ? [28, 48] : [34, 50]));
    if (taxConfig.showUGST) widths.push(...(compactMode ? [28, 48] : [34, 50]));
    if (taxConfig.showIGST) widths.push(...(compactMode ? [28, 48] : [34, 50]));
    if (taxConfig.showVAT)  widths.push(...(compactMode ? [28, 48] : [34, 50]));

    widths.push(compactMode ? (hasForeignCurrencyColumn ? 48 : 54) : 58); // Amt in Local Currency

    if (invoiceCurr && invoiceCurr !== localCurrency) {
      widths.push(compactMode ? 44 : 58); // Amt in Party Currency
    }

    /* ---------------- RETURN ---------------- */
    return {
      table: {
        headerRows: 1,
        widths,
        body: [headerRow, ...dataRows, totalRow]
      },
      layout: compactMode ? compactBorderedLayout : PDF_TABLE_LAYOUTS.bordered,
      margin: [0, 0, 0, 2],
      fontSize: compactMode ? 6 : undefined
    };
  }


  /**
   * Build totals section
   */
  function buildTotalsSection(data: InvoicePdfData): any {
    return { text: '' };
  }

  function getNormalizedCompanyCountry(data: InvoicePdfData): string {
    return String(
      (data as any)?.companyCountryCode ||
      data.company?.countryCode ||
      data.branch?.countryCode ||
      (data.company as any)?.country ||
      (data.branch as any)?.country ||
      ''
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, '');
  }

  function isIndiaPdfInvoice(data: InvoicePdfData, taxConfig: any = {}): boolean {
    const companyCountry = getNormalizedCompanyCountry(data);

    if (companyCountry) {
      return companyCountry === 'in' || companyCountry === 'india';
    }

    return !taxConfig.showVAT;
  }

  function isNonJobPdfInvoice(data: InvoicePdfData): boolean {
    const printData = (data as any)?.invoicePrintData || {};
    return printData?.IsNonJobInvoice === true ||
      printData?.IsNonJobInvoice === 'Y' ||
      printData?.CashOrBank === 'Y' ||
      (data as any)?.invoiceData?.CashOrBank === 'Y';
  }

  function isCompanyMasterSid(data: InvoicePdfData, companyMasterSid: number): boolean {
    return Number(
      (data.company as any)?.CompanyMasterSid ||
      (data as any)?.companyMasterSid ||
      (data as any)?.invoicePrintData?.CompanyMasterSid
    ) === companyMasterSid;
  }

  function buildInvoicePrintStyleTotalRow(colCount: number, grandTotal: any): any[] {
    const mergedTotalColumns = Math.max(colCount - 1, 1);
    const totalRow: any[] = [
      {
        text: 'Total',
        colSpan: mergedTotalColumns,
        style: 'tableCellBoldSmall',
        alignment: 'right',
        noWrap: true
      }
    ];

    for (let i = 1; i < mergedTotalColumns; i++) {
      totalRow.push({});
    }

    if (colCount > 1) {
      totalRow.push({
        text: formatNumberWithCommas(parsePdfNumber(grandTotal), 2),
        style: 'tableCellBoldSmall',
        alignment: 'right',
        noWrap: true
      });
    }

    return totalRow;
  }

  function buildIndiaGstTotalRow(details: any[], showHsnSac: boolean, hasForeignCurrencyColumn: boolean, grandTotal: any): any[] {
    const baseColumns = 7 + (showHsnSac ? 1 : 0);
    const totalColSpan = baseColumns + 1;
    const totalRow: any[] = [];

    totalRow.push({
      text: 'Total',
      colSpan: totalColSpan,
      style: 'tableCellBoldSmall',
      alignment: 'right',
      noWrap: true
    });

    for (let i = 1; i < totalColSpan; i++) {
      totalRow.push({});
    }

    totalRow.push({ text: formatNumberWithCommas(sumPdfDetailAmount(details, 'cgstAmt', 'cgstAmount'), 2), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true });
    totalRow.push({ text: '', style: 'tableCellSmall' });
    totalRow.push({ text: formatNumberWithCommas(sumPdfDetailAmount(details, 'sgstAmt', 'sgstAmount'), 2), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true });
    totalRow.push({
      text: hasForeignCurrencyColumn
        ? formatNumberWithCommas(sumPdfDetailAmount(details, 'LocalAmount', 'localAmount'), 2)
        : formatNumberWithCommas(parsePdfNumber(grandTotal), 2),
      style: 'tableCellBoldSmall',
      alignment: 'right',
      noWrap: true
    });

    if (hasForeignCurrencyColumn) {
      totalRow.push({ text: formatNumberWithCommas(parsePdfNumber(grandTotal), 2), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true });
    }

    return totalRow;
  }

  function buildVatTotalRow(details: any[], showHsnSac: boolean, hasForeignCurrencyColumn: boolean, grandTotal: any): any[] {
    const baseColumns = 7 + (showHsnSac ? 1 : 0);
    const totalColSpan = baseColumns + 1;
    const totalRow: any[] = [];

    totalRow.push({
      text: 'Total',
      colSpan: totalColSpan,
      style: 'tableCellBoldSmall',
      alignment: 'right',
      noWrap: true
    });

    for (let i = 1; i < totalColSpan; i++) {
      totalRow.push({});
    }

    totalRow.push({ text: formatNumberWithCommas(sumPdfDetailAmount(details, 'vatAmt', 'vatAmount'), 2), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true });
    totalRow.push({
      text: hasForeignCurrencyColumn
        ? formatNumberWithCommas(sumPdfDetailAmount(details, 'LocalAmount', 'localAmount'), 2)
        : formatNumberWithCommas(parsePdfNumber(grandTotal), 2),
      style: 'tableCellBoldSmall',
      alignment: 'right',
      noWrap: true
    });

    if (hasForeignCurrencyColumn) {
      totalRow.push({ text: formatNumberWithCommas(parsePdfNumber(grandTotal), 2), style: 'tableCellBoldSmall', alignment: 'right', noWrap: true });
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

  function buildAmountInWords(data: InvoicePdfData): any {
    const printData = (data as any).invoicePrintData;
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
          width: 6,
          text: ':',
          alignment: 'center'
        },
        {
          width: '*',
          text: amountInWords,
          margin: [4, 0, 0, 0],
          // italics: true 
        }
      ]
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
        width: 88,
        text: 'Remarks',
        style: 'labelBold'
      },
      {
        width: 6,
        text: ':',
        alignment: 'center'
      },
      {
        width: '*',
        text: remarks,
        margin: [4, 0, 0, 0]
      }
    ]
  };
}

function buildContainerDetails(data: InvoicePdfData): any {
  const printData = (data as any).invoicePrintData;
  const containerValue = printData?.ContainerNumber || data.invoice?.containerNumber || '';

  if (!containerValue) {
    return null;
  }

  return {
    margin: [0, 2, 0, 2],
    columns: [
      {
        width: 88,
        text: 'Cont No. / Type',
        style: 'labelBold'
      },
      {
        width: 6,
        text: ':',
        alignment: 'center'
      },
      {
        width: '*',
        text: containerValue,
        margin: [4, 0, 0, 0]
      }
    ]
  };
}

  /**
   * Build bank details section
   */

function buildBankDetailsSection(data: InvoicePdfData): any[] {
  const bankDetails = data.bankDetails || [];
  const isVATMode = data.isVATMode !== false;

  if (bankDetails.length === 0) return [];

  const getBankValue = (bank: any, ...keys: string[]): string => {
    for (const key of keys) {
      const value = bank?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value);
      }
    }
    return '';
  };

  const getBankCurrencyCode = (bank: any): string =>
    getBankValue(bank, 'CurrencyCode', 'currencyCode', 'bankCurrencyCode') ||
    data.invoice?.currencyCode ||
    data.localCurrency ||
    '';

  // Filter valid banks with at least one field populated
  const validBanks = bankDetails.filter((bank: any) =>
    getBankValue(bank, 'BeneficiaryName', 'beneficiaryName', 'AccountName', 'accountName') ||
    getBankValue(bank, 'BankAccountNo', 'accountNo') ||
    getBankValue(bank, 'BankName', 'bankName') ||
    getBankValue(bank, 'IFSCCode', 'ifscCode', 'IBAN', 'iban') ||
    getBankValue(bank, 'BankCode', 'swiftCode') ||
    getBankValue(bank, 'BankAddress', 'bankAddress', 'Address', 'address') ||
    getBankValue(bank, 'BranchName', 'branchName')
  );

  if (validBanks.length === 0) return [];

  const banksToDisplay = validBanks;

  // Create header row
  const headers = [
    { text: 'Details', style: 'tableHeader', alignment: 'center' }
  ];

  // Add bank columns dynamically
  for (let i = 0; i < banksToDisplay.length; i++) {
    const currencyCode = getBankCurrencyCode(banksToDisplay[i]);
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
      text: getBankValue(banksToDisplay[i], 'BeneficiaryName', 'beneficiaryName', 'AccountName', 'accountName'),
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
    fontSize: 8
  }];
  for (let i = 0; i < banksToDisplay.length; i++) {
    accountRow.push({ 
      text: getBankValue(banksToDisplay[i], 'BankAccountNo', 'accountNo'),
      alignment: 'left',
      noWrap: false,
      fontSize: 8
    });
  }
  rows.push(accountRow);

  // IBAN/IFSC row
  const ibanRow: any[] = [{ 
    text: isVATMode ? 'IBAN' : 'IFSC',
    style: 'labelBold', 
    alignment: 'left',
    fontSize: 8
  }];
  for (let i = 0; i < banksToDisplay.length; i++) {
    if (isVATMode) {
      ibanRow.push({ 
        text: getBankValue(banksToDisplay[i], 'IFSCCode', 'iban', 'IBAN', 'ifscCode'),
        alignment: 'left',
        noWrap: false,
        fontSize: 8
      });
    } else {
      ibanRow.push({ 
        text: getBankValue(banksToDisplay[i], 'IFSCCode', 'ifscCode'),
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
      text: getBankValue(banksToDisplay[i], 'BankCode', 'swiftCode'),
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
      text: getBankValue(banksToDisplay[i], 'BankName', 'bankName'),
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
      text: getBankValue(banksToDisplay[i], 'BankAddress', 'bankAddress', 'Address', 'address', 'BranchName', 'branchName'),
      alignment: 'left',
      noWrap: false,
      lineHeight: 1.1,  // Reduced from 1.2
      fontSize: 8
    });
  }
  rows.push(branchRow);

  // Calculate column widths dynamically based on number of banks
  const DETAILS_COLUMN_WIDTH = 110;
  const widths: (number | string)[] = [DETAILS_COLUMN_WIDTH];

  if (banksToDisplay.length === 1) {
    widths.push('auto');
  } else {
    for (let i = 0; i < banksToDisplay.length; i++) {
      widths.push('*');
    }
  }

  const bankTable = {
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
        paddingLeft: () => 3,      // Reduced from 6
        paddingRight: () => 3,     // Reduced from 6
        paddingTop: () => 2,       // Reduced from 5
        paddingBottom: () => 2     // Reduced from 5
      },
      margin: [0, 0, 0, 5],  // Reduced bottom margin from 10 to 5
      style: { noWrap: false }
    };

  return [
    {
      stack: [
        buildSectionTitle('Bank Details', { margin: [0, 10, 0, 3] }),  // Reduced margin
        bankTable
      ],
      unbreakable: true
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
          margin: [0, 0, 0, 6]
        }
      ],
      margin: [0, 0, 0, 8]
    };
  }

  function getInvoiceTerms(data: InvoicePdfData): PdfTermItem[] {
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
  function buildAuthorisedSignatory(data: InvoicePdfData): any[] {
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
   * Transform API data to InvoicePdfData format
   * IMPORTANT: This receives the RAW API data (invoiceData), not invoicePrintData
   */
  export function transformInvoiceApiData(
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
      companyCountryCode?: string;
      companyVatNo?: string;
      shipmentDetails?: any;
      cargoDetails?: any;
      invoicePrintData?: any; // CRITICAL: The formatted print data
      containerTypeList?: any[];
      printSettings?: {
        logoPosition: 'left' | 'center' | 'right';
        companyPosition: 'left' | 'center' | 'right';
        companyAlignment: 'left' | 'center' | 'right';
      };
    }
  ): InvoicePdfData {
    const invoice = apiData;
    const masterJob = invoice.masterJob;
    const houseJob = invoice.houseJob;
    const bookingHeader = invoice.BookingHeader;
    const containerTypeList = (options as any)?.containerTypeList || [];

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
      beneficiaryName: bank.BeneficiaryName || bank.beneficiaryName || bank.AccountName || bank.accountName || '',
      currencyCode: bank.CurrencyCode ||
        bank.currencyCode ||
        bank.currencyMaster?.currencyCode ||
        lookups?.currencyMaster?.find((currency: any) =>
          Number(currency?.CurrencyMasterSid) === Number(bank.CurrencyMasterSid || bank.currencyMasterSid)
        )?.currencyCode ||
        ''
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
        countryCode: company?.countryMaster?.countryCode || company?.countryCode || '',
        country: company?.countryMaster?.countryName || company?.countryName || '',
        postalCode: company?.postal_code || company?.ZipCode || '',
        phoneNumber: company?.phoneNumber || company?.Phone || ''
      },
      branch: {
        branchName: branch?.branchName || '',
        branchCode: branch?.branchCode || branch?.BranchCode || '',
        addressLine1: branch?.addressLine1 || '',
        addressLine2: branch?.addressLine2 || '',
        cityName: branch?.cityMaster?.cityName || '',
        countryCode: branch?.countryMaster?.countryCode || branch?.countryCode || company?.countryMaster?.countryCode || company?.countryCode || '',
        country: branch?.countryMaster?.countryName || branch?.countryName || company?.countryMaster?.countryName || company?.countryName || '',
        postalCode: branch?.postalCode || '',
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
      companyCountryCode: options?.companyCountryCode,
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
        containerType: '',
        containerNumber: buildContainerDisplay(masterJob?.containers, containerTypeList) || masterJob?.ContainerNumber || houseJob?.ContainerNumber || ''
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
        showUGST: false,
        showIGST: false,
        showVAT: true
      },
      companyVatNo: options?.companyVatNo || branch?.taxRegistrationNo || company?.GST_VAT || '',
      isSeaMode: options?.isSeaMode,
      isVATMode: options?.isVATMode,
      authorisedSignatory: true,
      cargoDetails: options?.cargoDetails,
      printSettings: options?.printSettings || {
        logoPosition: 'left',
        companyPosition: 'center',
        companyAlignment: 'center'
      },
      invoicePrintData: options?.invoicePrintData  // Pass through invoicePrintData
    };

    return result;
  }
