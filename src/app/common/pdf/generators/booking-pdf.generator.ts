/**
 * Booking PDF Generator
 * Generates Booking Confirmation and CRO (Container Release Order) PDFs
 */

import { BookingPdfData, CroPdfData, BookingDocumentType } from '../interfaces/pdf-document.interfaces';
import { buildCompanyHeader } from '../builders/pdf-header.builder';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { buildTwoColumnInfo } from '../builders/pdf-table.builder';
import {
  buildTitle,
  buildSectionTitle,
  buildDivider,
  buildRemarks,
  buildTermsSection
} from '../builders/pdf-section.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS } from '../styles/pdf-styles';
import { formatDate } from '../helpers/pdf-formatters';

/**
 * Generate booking confirmation PDF document definition
 */
export function generateBookingDocument(
  data: BookingPdfData,
  documentType: BookingDocumentType = 'booking'
): any {
  if (documentType === 'cro') {
    return generateCroDocument(data as any);
  }

  const departmentLabel = data.departmentName ? ` - ${data.departmentName}` : '';

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || [20, 20, 20, 100],

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

    content: [
      // Header
      buildCompanyHeader(data),

      // Title
      buildBookingTitle(`Booking Confirmation${departmentLabel}`),

      // Customer and Booking Info
      buildBookingInfo(data),

      // Divider
      buildDivider({ width: 555, margin: [0, 6, 0, 8], thickness: 0.5 }),

      // Confirmation message
      {
        text: 'We are pleased to confirm your booking as below',
        style: 'labelBold',
        fontSize: 8,
        margin: [4, 0, 0, 6]
      },

      // Shipment Details
      buildShipmentDetails(data),

      // Cargo details table
      buildBookingCargoDetails(data),

      // Cost/Revenue table
      // buildBookingRatesTable(data),

      // Terms heading should show even when no terms are available.
      buildTermsSection(data.terms || [], { showTitleWhenEmpty: true })
    ],
    footer: (currentPage: number, pageCount: number) => buildBookingFooter(data, currentPage, pageCount),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function buildBookingTitle(title: string): any {
  const fullWidth = 555;

  return {
    stack: [
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: fullWidth, y2: 0, lineWidth: 0.5, lineColor: '#000000' }
        ],
        margin: [0, 0, 0, 6]
      },
      {
        text: title,
        alignment: 'center',
        bold: true,
        fontSize: 10,
        margin: [0, 3, 0, 8]
      },
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: fullWidth, y2: 0, lineWidth: 0.5, lineColor: '#000000' }
        ],
        margin: [0, 0, 0, 8]
      }
    ],
    margin: [0, 0, 0, 2]
  };
}

/**
 * Build booking information section (two columns)
 */
function buildBookingInfo(data: BookingPdfData): any {
  const booking = data.booking;

  const leftBlock = {
    stack: [
      { text: 'Customer', style: 'labelBold', fontSize: 8, margin: [8, 0, 0, 4] },
      { text: booking?.customerName || '', fontSize: 8, margin: [24, 0, 0, 3] },
      { text: booking?.customerAddress || '', fontSize: 8, margin: [24, 0, 10, 0] }
    ]
  };

  const rightItems = [
    { label: 'Booking No.', value: booking?.bookingNo || '', fontSize: 8 },
    { label: 'Booking Date', value: formatDate(booking?.bookingDate) || '' , fontSize: 8 },
    { label: 'Cut Off Date', value: formatDate(booking?.cutOffDate) || '' , fontSize: 8 },
  ];

  const rightBlock = {
    stack: rightItems.map((item) => ({
      columns: [
        { text: item.label, style: 'labelBold', width: 85 },
        { text: ':', width: 2 },
        { text: item.value, width: '*' }
      ],
      margin: [0, 0, 0, 6]
    }))
  };

  return {
    columns: [
      { width: '49%', ...leftBlock },
      { width: '51%', ...rightBlock }
    ],
    columnGap: 10,
    margin: [0, 0, 0, 4]
  };
}

/**
 * Build shipment details section
 */
function buildShipmentDetails(data: BookingPdfData): any {
  const booking = data.booking;
  const route = data.route;
  const firstCargo = data.cargo?.[0] || {};
  const firstProduct = data.products?.[0];

  const leftDetails = [
    { label: 'Vessel/Voyage', value: [booking?.vesselName, booking?.voyageNo].filter(Boolean).join(' / ') },
    { label: 'POL', value: formatPort(route?.pol) },
    { label: 'POD', value: formatPort(route?.pod) },
    { label: 'FPD', value: formatPort(route?.fpd) },
    { label: 'Shipper Name', value: booking?.shipperName || '' },
    { label: 'Shipping Bill No.', value: firstProduct?.shippingBillNo || '' },
    { label: 'Inco Terms', value: booking?.incoTerms || '' },
    { label: 'Hand Over To', value: booking?.handOverTo || '' },
    { label: 'Shipment Terms', value: firstCargo?.shipmentTerms || '' }
  ];

  const rightDetails = [
    { label: data.fclLcl === 'AIR' ? 'HAWBL No.' : 'HBL No.', value: booking?.hblNo || '' },
    { label: 'ETD', value: formatDate(booking?.polEtd) },
    { label: 'ETA', value: formatDate(booking?.podEta || booking?.fpdEta) },
    { label: 'Freight', value: booking?.freightTerms || '' },
    { label: 'Dest Agent', value: booking?.destinationAgent || '' },
    { label: 'Consignee Name', value: booking?.consigneeName || '' },
    { label: 'Carrier', value: booking?.carrierName || '' },
    { label: 'Carrier Booking', value: booking?.carrierBookingRef || '' },
    { label: 'Remarks', value: booking?.remarks || '' }
  ];

  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: buildDetailRows(leftDetails, 95), margin: [4, 3, 2, 3] },
        { stack: buildDetailRows(rightDetails, 95), margin: [4, 3, 2, 3] }
      ]]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 0.5 : 0,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [0, 0, 0, 5]
  };
}

function buildDetailRows(items: Array<{ label: string; value: string }>, labelWidth: number): any[] {
  return items.map((item) => ({
    columns: [
      { text: item.label, style: 'labelBold', fontSize: 8, width: labelWidth },
      { text: ':', width: 6 },
      { text: item.value || '', fontSize: 8, width: '*' }
    ],
    margin: [0, 3, 0, 3]
  }));
}

/**
 * Format number to 3 decimal places with comma separators
 * e.g. 1000 -> "1,000.000", 1.25 -> "1.250"
 */
function formatDecimal(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const num = parseFloat(String(value));
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
}

function buildBookingCargoDetails(data: BookingPdfData): any {
  const cargoList = data.cargo || [];
  if (cargoList.length === 0) {
    return { text: '' };
  }

  const fclLcl = data.fclLcl?.toUpperCase();

  const headerRow: any[] = [
    { text: 'Cargo Type', style: 'tableHeader', alignment: 'center' }
  ];
  const buildValueRow = (cargo: any): any[] => {
    const valueRow: any[] = [
      { text: cargo.cargoType || '', style: 'tableCell' }
    ];

    if (fclLcl === 'FCL') {
      valueRow.push(
        { text: cargo.containerType || '', style: 'tableCell' },
        { text: safeText(cargo.noOfContainers), style: 'tableCell', alignment: 'right' },
        { text: formatDecimal(cargo.grossWeight), style: 'tableCell', alignment: 'right' },
        { text: formatDecimal(cargo.volume), style: 'tableCell', alignment: 'right' }
      );
    } else if (fclLcl === 'LCL') {
      valueRow.push(
        { text: formatDecimal(cargo.grossWeight), style: 'tableCell', alignment: 'right' },
        { text: safeText(cargo.noOfPackage), style: 'tableCell', alignment: 'right' },
        { text: formatDecimal(cargo.chargeableWeight), style: 'tableCell', alignment: 'right' },
        { text: formatDecimal(cargo.volume), style: 'tableCell', alignment: 'right' }
      );
    } else if (fclLcl === 'AIR') {
      valueRow.push(
        { text: formatDecimal(cargo.grossWeight), style: 'tableCell', alignment: 'right' },
        { text: formatDecimal(cargo.chargeableWeight), style: 'tableCell', alignment: 'right' },
        { text: formatDecimal(cargo.volume), style: 'tableCell', alignment: 'right' }
      );
    }

    return valueRow;
  };

  if (fclLcl === 'FCL') {
    // FCL: Cargo Type | Container Type | No. of Containers | Gross Weight | Volume (CBM)
    headerRow.push(
      { text: 'Container Type', style: 'tableHeader', alignment: 'center' },
      { text: 'No. of Containers', style: 'tableHeader', alignment: 'center' },
      { text: 'Gross Weight', style: 'tableHeader', alignment: 'center' },
      { text: 'Volume (CBM)', style: 'tableHeader', alignment: 'center' }
    );
  } else if (fclLcl === 'LCL') {
    // LCL: Cargo Type | Gross Weight | No. of Pkg | Chargeable Weight | Volume (CBM)
    headerRow.push(
      { text: 'Gross Weight', style: 'tableHeader', alignment: 'center' },
      { text: 'No. of Pkg', style: 'tableHeader', alignment: 'center' },
      { text: 'Chargeable Weight', style: 'tableHeader', alignment: 'center' },
      { text: 'Volume (CBM)', style: 'tableHeader', alignment: 'center' }
    );
  } else if (fclLcl === 'AIR') {
    // AIR: Cargo Type | Gross Weight | Chargeable Weight | Volume (CBM)
    headerRow.push(
      { text: 'Gross Weight', style: 'tableHeader', alignment: 'center' },
      { text: 'Chargeable Weight', style: 'tableHeader', alignment: 'center' },
      { text: 'Volume (CBM)', style: 'tableHeader', alignment: 'center' }
    );
  }

  const valueRows = cargoList.map((cargo) => buildValueRow(cargo));

  return {
    stack: [
      { text: 'Cargo Details', style: 'sectionTitle', margin: [0, 5, 0, 5] , fontSize:8},
      {
        table: {
          headerRows: 1,
          widths: new Array(headerRow.length).fill('*'),
          body: [headerRow, ...valueRows],
        },
        layout: PDF_TABLE_LAYOUTS.bordered,
        margin: [0, 0, 0, 6]
      }
    ]
  };
}

// function buildBookingRatesTable(data: BookingPdfData): any {
//   const rows = data.bookingRates || [];
//   if (!rows.length) {
//     return { text: '' };
//   }

//   const totals = rows.reduce(
//     (acc: { proRev: number; proCost: number; proGross: number; actRev: number; actCost: number; actGross: number }, item) => {
//       acc.proRev += Number(item.proRevenueAmount || 0);
//       acc.proCost += Number(item.proCostAmount || 0);
//       acc.proGross += Number(item.proGross || 0);
//       acc.actRev += Number(item.actualRevenueAmount || 0);
//       acc.actCost += Number(item.actualCostAmount || 0);
//       acc.actGross += Number(item.actualGross || 0);
//       return acc;
//     },
//     { proRev: 0, proCost: 0, proGross: 0, actRev: 0, actCost: 0, actGross: 0 }
//   );

//   return {
//     table: {
//       headerRows: 2,
//       widths: ['*', 70, 70, 70, 70, 70, 70],
//       body: [
//         [
//           { text: 'Charge', style: 'tableHeader', rowSpan: 2 },
//           { text: 'Provisional', style: 'tableHeader', colSpan: 3, alignment: 'center' },
//           {},
//           {},
//           { text: 'Actual', style: 'tableHeader', colSpan: 3, alignment: 'center' },
//           {},
//           {}
//         ],
//         [
//           {},
//           { text: 'Rev Amt', style: 'tableHeader' },
//           { text: 'Cost Amt', style: 'tableHeader' },
//           { text: 'GP', style: 'tableHeader' },
//           { text: 'Rev Amt', style: 'tableHeader' },
//           { text: 'Cost Amt', style: 'tableHeader' },
//           { text: 'GP', style: 'tableHeader' }
//         ],
//         ...rows.map((item) => ([
//           { text: item.chargeName || '', style: 'tableCell' },
//           { text: Number(item.proRevenueAmount || 0).toFixed(2), style: 'tableCell', alignment: 'right' },
//           { text: Number(item.proCostAmount || 0).toFixed(2), style: 'tableCell', alignment: 'right' },
//           { text: Number(item.proGross || 0).toFixed(2), style: 'tableCell', alignment: 'right' },
//           { text: Number(item.actualRevenueAmount || 0).toFixed(2), style: 'tableCell', alignment: 'right' },
//           { text: Number(item.actualCostAmount || 0).toFixed(2), style: 'tableCell', alignment: 'right' },
//           { text: Number(item.actualGross || 0).toFixed(2), style: 'tableCell', alignment: 'right' }
//         ])),
//         [
//           { text: 'Total', style: 'tableCellBold', alignment: 'right' },
//           { text: totals.proRev.toFixed(2), style: 'tableCellBold', alignment: 'right' },
//           { text: totals.proCost.toFixed(2), style: 'tableCellBold', alignment: 'right' },
//           { text: totals.proGross.toFixed(2), style: 'tableCellBold', alignment: 'right' },
//           { text: totals.actRev.toFixed(2), style: 'tableCellBold', alignment: 'right' },
//           { text: totals.actCost.toFixed(2), style: 'tableCellBold', alignment: 'right' },
//           { text: totals.actGross.toFixed(2), style: 'tableCellBold', alignment: 'right' }
//         ]
//       ]
//     },
//     layout: 'bordered',
//     margin: [0, 4, 0, 6]
//   };
// }

function safeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function getTermText(term: any): string {
  if (typeof term === 'string') {
    return term.trim();
  }

  return (term?.content || term?.TandC || term?.Terms || '').trim();
}

function getUniqueTerms(terms: any[]): string[] {
  return (terms || [])
    .map((term: any) => getTermText(term))
    .filter((term: string, index: number, arr: string[]) => !!term && arr.indexOf(term) === index);
}

function buildBookingFooter(data: BookingPdfData, currentPage: number, pageCount: number): any {
  const footerInfoRow = {
    columns: [
      {
        text: `Printed By: ${data.userData?.userName || ''}`,
        fontSize: 7,
        alignment: 'left',
        width: '25%'
      },
      {
        text: 'This document is computer-generated and does not require a signature.',
        fontSize: 7,
        alignment: 'center',
        width: '50%'
      },
      {
        text: `Printed On: ${formatDate(new Date())}`,
        fontSize: 7,
        alignment: 'right',
        width: '25%'
      }
    ],
    margin: [20, 4, 20, 0]   // ✅ was [6, 0, 6, 0]
  };

  if (currentPage !== pageCount) {
    return {
      stack: [footerInfoRow],
      margin: [0, 8, 0, 0]   // ✅ was just returning footerInfoRow directly
    };
  }

  return {
    stack: [
      // {
      //   canvas: [
      //     { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }  // ✅ added divider line
      //   ],
      //   margin: [20, 0, 20, 4]
      // },
      {
        text: "Your's Sincerely",
        style: 'labelBold',
        fontSize: 8,           // ✅ was no fontSize (inherited larger size)
        margin: [20, 0, 0, 1]  // ✅ was [6, 0, 0, 1]
      },
      {
        text: data.userData?.userName || '',
        style: 'labelBold',
        fontSize: 8,           // ✅ added fontSize
        margin: [20, 0, 0, 6]  // ✅ was [6, 0, 0, 8]
      },
      {
        text: 'IF YOU REQUIRE ANY FURTHER INFORMATION, PLEASE DO NOT HESITATE TO CONTACT US.\nTHANK YOU FOR SHIPPING WITH US',
        alignment: 'center',
        style: 'labelBold',
        fontSize: 8,           // ✅ was 10
        margin: [0, 0, 0, 6]   // ✅ was [0, 0, 0, 8]
      },
      footerInfoRow
    ],
    margin: [0, 8, 0, 15]       // ✅ was [18, 0, 18, 0]
  };
}

/**
 * Generate CRO (Container Release Order) PDF
 */
function generateCroDocument(data: CroPdfData): any {
  const departmentLabel = data.departmentName ? ` - ${data.departmentName}` : '';

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || PDF_DEFAULT_CONFIG.pageMargins,
    content: [
      // Header
      buildCompanyHeader(data),

      // Title
      buildTitle(`Container Release Order${departmentLabel}`),

      // CRO Info
      buildCroInfo(data),

      // Divider
      buildDivider(),

      // Container allocation table
      buildSectionTitle('Container Allocation'),
      buildContainerAllocationTable(data.containers),

      // Yard/CFS Instructions
      buildCroInstructions(data),

      // Remarks
      buildRemarks(data.cro?.remarks || ''),

      // Validity notice
      buildValidityNotice(data)
    ],
    footer: createFooterFunction(data.userData),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

/**
 * Build CRO information section
 */
function buildCroInfo(data: CroPdfData): any {
  const cro = data.cro;

  const leftItems = [
    { label: 'Customer', value: cro?.customerName || '' },
    { label: 'Address', value: cro?.customerAddress || '' },
    { label: 'Transporter', value: cro?.transporter || '' }
  ].filter(item => item.value);

  const rightItems = [
    { label: 'CRO No', value: cro?.croNumber || '' },
    { label: 'Release Date', value: formatDate(cro?.releaseOrderDate) },
    { label: 'Booking No', value: cro?.bookingNo || '' },
    { label: 'Vessel/Voyage', value: [cro?.vesselName, cro?.voyageNo].filter(Boolean).join(' / ') }
  ].filter(item => item.value);

  return buildTwoColumnInfo(leftItems, rightItems, { labelWidth: 100 });
}

/**
 * Build container allocation table
 */
function buildContainerAllocationTable(containers: any[]): any {
  if (!containers || containers.length === 0) {
    return { text: 'No containers allocated', style: 'muted', margin: [0, 0, 0, 15] };
  }

  const headerRow = [
    { text: 'Container Type', style: 'tableHeader' },
    { text: 'Size', style: 'tableHeader' },
    { text: 'Quantity', style: 'tableHeader', alignment: 'right' }
  ];

  const dataRows = containers.map(container => [
    { text: container.containerType || '', style: 'tableCell' },
    { text: container.size || '', style: 'tableCell' },
    { text: String(container.quantity || 0), style: 'tableCell', alignment: 'right' }
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ['*', 80, 80],
      body: [headerRow, ...dataRows]
    },
    layout: 'bordered',
    margin: [0, 0, 0, 15]
  };
}

/**
 * Build CRO instructions section
 */
function buildCroInstructions(data: CroPdfData): any {
  const cro = data.cro;
  const instructions: any[] = [];

  if (cro?.emptyYard) {
    instructions.push({
      columns: [
        { text: 'Empty Pickup From:', style: 'labelBold', width: 120 },
        { text: cro.emptyYard, width: '*' }
      ],
      margin: [0, 0, 0, 5]
    });

    if (cro.emptyYardAddress) {
      instructions.push({
        text: cro.emptyYardAddress,
        margin: [120, 0, 0, 10],
        style: 'muted'
      });
    }
  }

  if (cro?.pol) {
    instructions.push({
      columns: [
        { text: 'Stuffing Location:', style: 'labelBold', width: 120 },
        { text: formatPort(cro.pol), width: '*' }
      ],
      margin: [0, 0, 0, 5]
    });
  }

  return {
    stack: instructions,
    margin: [0, 10, 0, 15]
  };
}

/**
 * Build validity notice
 */
function buildValidityNotice(data: CroPdfData): any {
  const validityDate = data.cro?.validityDate;

  return {
    stack: [
      {
        text: validityDate
          ? `This Container Release Order is valid until ${formatDate(validityDate)}.`
          : 'Please contact us for validity information.',
        style: 'muted',
        alignment: 'center',
        margin: [0, 20, 0, 0]
      },
      {
        text: 'This document must be presented to collect containers from the yard.',
        style: 'muted',
        alignment: 'center',
        margin: [0, 5, 0, 0]
      }
    ]
  };
}

/**
 * Format port info for display
 */
function formatPort(port: { portName: string; portCode: string } | undefined): string {
  if (!port) return '';
  return port.portCode ? `${port.portName} - ${port.portCode}` : port.portName;
}

/**
 * Transform API data to BookingPdfData format
 */
export function transformBookingApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  lookups?: {
    ports?: any[];
    departments?: any[];
    carriers?: any[];
    agents?: any[];
    containerTypes?: any[];
  },
  options?: {
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  }
): BookingPdfData {
  const booking = apiData;
  const bookingCargo = booking.bookingCargo || [];
  const bookingProducts = booking.bookingProduct || [];
  const bookingRates = booking.bookingRates || [];
  const bookingOthers = booking.bookingOthers?.[0] || {};
  const normalizedTerms = getUniqueTerms(booking.terms || []);

  // Helper to get port info
  const getPortInfo = (portCodeOrName: string, explicitCode?: string) => {
    if (!portCodeOrName) return undefined;

    const normalized = String(portCodeOrName).trim().toUpperCase();
    const matchedPort = lookups?.ports?.find((p: any) => {
      const code = String(p?.PortCode || p?.portCode || '').trim().toUpperCase();
      const name = String(p?.PortName || p?.portName || '').trim().toUpperCase();
      return code === normalized || name === normalized;
    });

    const resolvedName = matchedPort?.PortName || matchedPort?.portName || portCodeOrName;
    const resolvedCode =
      explicitCode ||
      matchedPort?.PortCode ||
      matchedPort?.portCode ||
      (resolvedName === portCodeOrName ? '' : portCodeOrName);

    return { portName: resolvedName, portCode: resolvedCode || '' };
  };

  // Resolve fclLcl from FCLLCL field or fallback to departmentMaster name
  const resolveFclLcl = (): 'FCL' | 'LCL' | 'AIR' => {
    if (booking.FCLLCL) {
      const val = booking.FCLLCL.toUpperCase();
      if (val === 'FCL' || val === 'LCL' || val === 'AIR') return val;
    }
    const deptName = (booking.departmentMaster?.departmentName || booking.DepartmentName || '').toUpperCase();
    if (deptName.includes('FCL')) return 'FCL';
    if (deptName.includes('AIR')) return 'AIR';
    return 'LCL'; // default fallback
  };

  return {
    company: {
      companyName: company?.companyName || '',
      addressLine1: company?.addressLine1 || company?.Address || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || '',
      postalCode: company?.postal_code || company?.ZipCode || '',
      phoneNumber: company?.phoneNumber || company?.Phone || '',
      countryMaster: company?.countryMaster,
      countryCode: company?.countryMaster?.countryCode || company?.countryCode || ''
    },
    branch: {
      branchName: branch?.branchName || '',
      addressLine1: branch?.addressLine1 || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || '',
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster,
      countryMaster: branch?.countryMaster,
      countryCode: branch?.countryMaster?.countryCode || branch?.countryCode || ''
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
    booking: {
      bookingNo: booking.BookingNo || '',
      bookingDate: booking.BookingDateTime || booking.BookingDate,
      cutOffDate: booking.voyageDetails?.POLCutOffDate || booking.voyageDetails?.PortCutoff || booking.POLCutOffDate,
      customerName: booking.CustomerName || '',
      customerAddress: booking.CustomerAddress || '',
      shipperName: booking.ShipperName || '',
      shipperAddress: booking.ShipperAddress || '',
      consigneeName: booking.ConsigneeName || '',
      consigneeAddress: booking.ConsigneeAddress || '',
      vesselName: booking.VesselName || '',
      voyageNo: booking.VoyageNo || '',
      carrierName: booking.CarrierName || '',
      carrierBookingRef: bookingOthers.CarrierBookingRef || '',
      hblNo: booking.HBLNo || '',
      mblNo: booking.MBLNo || '',
      quotationNumber: booking.quotationHeader?.QuoteNumber || '',
      polEta: booking.voyageDetails?.POLETA || booking.POLETA,
      polEtd: booking.voyageDetails?.POLETD || booking.POLETD || booking.ETD,
      podEta: booking.voyageDetails?.PODETA || booking.PODETA || booking.ETA,
      fpdEta: booking.FPDETA || booking.voyageDetails?.FPDETA || booking.ETA,
      incoTerms: booking.IncoTerms || '',
      freightTerms: booking.FreightTerms || '',
      handOverTo: bookingOthers.YardCFS || '',
      destinationAgent: resolveDestinationAgent(booking, lookups?.agents),
      remarks: booking.InternalNote || ''
    },
    route: {
      pol: getPortInfo(booking.POL),
      pod: getPortInfo(booking.POD),
      fpd: getPortInfo(booking.FPD)
    },
    cargo: bookingCargo.map((cargo: any) => ({
      cargoType: cargo.CargoType || '',
      containerType: resolveContainerTypeText(cargo, lookups?.containerTypes),
      noOfContainers: cargo.NoofContainers || 0,
      noOfPackage: cargo.NoOfPackage || 0,
      grossWeight: cargo.GrossWeight || 0,
      netWeight: cargo.NetWeight || 0,
      volume: cargo.Volume || 0,
      chargeableWeight: cargo.ChargeableWeight || 0,
      shipmentTerms: cargo.ShipmentTerms || ''
    })),
    bookingRates: bookingRates.map((rate: any) => {
      const proRevenueAmount = Number(rate?.RevenueLocalAmount ?? 0);
      const proCostAmount = Number(rate?.CostLocalAmount ?? 0);
      const hasRevenueVoucher = !!(rate?.RevenueVoucherHeaderSid || rate?.revenueVoucherHeader?.VoucherHeaderSid);
      const hasCostVoucher = !!(rate?.CostVoucherHeaderSid || rate?.costVoucherHeader?.VoucherHeaderSid);
      const actualRevenueAmount = hasRevenueVoucher
        ? Number(
          rate?.RevenueLocalAmount ??
          0
        )
        : 0;
      const actualCostAmount = hasCostVoucher
        ? Number(
          rate?.CostLocalAmount ??
          0
        )
        : 0;

      return {
        chargeName: rate?.ChargeDescription || rate?.ChargeName || rate?.ChargeMaster?.chargeName || '',
        proRevenueAmount,
        proCostAmount,
        proGross: proRevenueAmount - proCostAmount,
        actualRevenueAmount,
        actualCostAmount,
        actualGross: actualRevenueAmount - actualCostAmount
      };
    }),
    products: bookingProducts.map((product: any) => ({
      productName: product.ProductName || '',
      hsCode: product.HSCode || '',
      description: product.Description || '',
      quantity: product.Quantity || 0,
      grossWeight: product.GrossWeight || 0,
      netWeight: product.NetWeight || 0,
      volume: product.Volume || 0,
      shippingBillNo: product.ShippingBillNo || '',
      shippingBillDate: product.ShippingBillDate
    })),
    terms: normalizedTerms.map((term: string) => ({
      content: term
    })),
    fclLcl: resolveFclLcl(),
    departmentName: booking.departmentMaster?.departmentName || booking.DepartmentName || ''
  };
}

function resolveDestinationAgent(booking: any, agents?: any[]): string {
  if (booking?.DestinationAgentName) return booking.DestinationAgentName;
  if (booking?.AgentName) return booking.AgentName;
  if (!booking?.DestinationAgent || !agents?.length) return '';
  const matched = agents.find((agent: any) => {
    const sid = agent?.AgentMasterSid ?? agent?.CustomerMasterSid ?? agent?.id ?? agent?.masterSid;
    return String(sid) === String(booking.DestinationAgent);
  });

  return matched?.AgentName || matched?.CustomerName || matched?.agentName || matched?.name || '';
}

function resolveContainerTypeText(cargo: any, containerTypes?: any[]): string {
  const directName =
    cargo?.ContainerTypeName ||
    cargo?.containerTypeName ||
    cargo?.ContainerName ||
    cargo?.containerName;
  if (directName) return String(directName);

  const rawType = cargo?.ContainerType ?? cargo?.containerType;
  const rawTypeText = rawType !== null && rawType !== undefined ? String(rawType).trim() : '';
  const numericTypeId = Number(rawTypeText);
  const hasNumericTypeId = rawTypeText !== '' && !Number.isNaN(numericTypeId);

  if (hasNumericTypeId && Array.isArray(containerTypes) && containerTypes.length > 0) {
    const matched = containerTypes.find((item: any) => {
      const sid = item?.ContainerTypeMasterSid ?? item?.ContainerTypeSid ?? item?.id;
      return Number(sid) === numericTypeId;
    });

    const matchedName =
      matched?.ContainerName ||
      matched?.ContainerType ||
      matched?.containerName ||
      matched?.containerType ||
      matched?.ContainerCode;
    if (matchedName) return String(matchedName);
  }

  const size = cargo?.ContainerSize ?? cargo?.containerSize;
  if (size !== null && size !== undefined && String(size).trim() !== '') {
    return `${String(size).trim()}ft Container`;
  }

  return rawTypeText;
}

/**
 * Transform API data to CroPdfData format
 */
export function transformCroApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string
): CroPdfData {
  const booking = apiData;
  const bookingOthers = booking.bookingOthers?.[0] || {};
  const bookingCargo = booking.bookingCargo || [];

  return {
    company: {
      companyName: company?.companyName || '',
      addressLine1: company?.addressLine1 || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || '',
      postalCode: company?.postal_code || '',
      phoneNumber: company?.phoneNumber || '',
      countryMaster: company?.countryMaster,
      countryCode: company?.countryMaster?.countryCode || company?.countryCode || ''
    },
    branch: {
      branchName: branch?.branchName || '',
      addressLine1: branch?.addressLine1 || '',
      cityName: branch?.cityMaster?.cityName || '',
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster,
      countryMaster: branch?.countryMaster,
      countryCode: branch?.countryMaster?.countryCode || branch?.countryCode || ''
    },
    userData: {
      userName: userData?.userName || '',
      email: userData?.email || ''
    },
    logo,
    cro: {
      croNumber: bookingOthers.CRONumber || booking.BookingNo || '',
      releaseOrderDate: bookingOthers.ReleaseOrderDate,
      bookingNo: booking.BookingNo || '',
      customerName: booking.CustomerName || '',
      customerAddress: booking.CustomerAddress || '',
      vesselName: booking.VesselName || '',
      voyageNo: booking.VoyageNo || '',
      pol: booking.POL ? { portName: booking.POL, portCode: '' } : undefined,
      pod: booking.POD ? { portName: booking.POD, portCode: '' } : undefined,
      transporter: bookingOthers.Transporter || '',
      transporterAddress: bookingOthers.TransporterAddress || '',
      emptyYard: bookingOthers.EmptyYard || '',
      emptyYardAddress: bookingOthers.EmptyYardAddress || '',
      validityDate: bookingOthers.ValidityDate,
      remarks: bookingOthers.Remarks || booking.InternalNote || ''
    },
    containers: bookingCargo.map((cargo: any) => ({
      containerType: cargo.ContainerType || '',
      quantity: cargo.NoofContainers || 1,
      size: cargo.ContainerSize || ''
    })),
    fclLcl: booking.FCLLCL || 'FCL',
    departmentName: booking.DepartmentName || ''
  };
}
