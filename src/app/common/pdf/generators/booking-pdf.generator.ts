/**
 * Booking PDF Generator
 * Generates Booking Confirmation and CRO (Container Release Order) PDFs
 */

import { BookingPdfData, CroPdfData, BookingDocumentType } from '../interfaces/pdf-document.interfaces';
import { buildHeader } from '../builders/pdf-header.builder';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { buildCargoTable, buildProductTable, buildTwoColumnInfo } from '../builders/pdf-table.builder';
import {
  buildTitle,
  buildSectionTitle,
  buildDivider,
  buildConfirmationMessage,
  buildRemarks,
  buildTermsSection
} from '../builders/pdf-section.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG } from '../styles/pdf-styles';
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
    pageMargins: data.config?.pageMargins || PDF_DEFAULT_CONFIG.pageMargins,
    content: [
      // Header
      buildHeader(data.company, data.branch, data.logo),

      // Title
      buildTitle(`Booking Confirmation${departmentLabel}`),

      // Customer and Booking Info
      buildBookingInfo(data),

      // Divider
      buildDivider(),

      // Confirmation message
      buildConfirmationMessage(),

      // Shipment Details
      buildShipmentDetails(data),

      // Cargo Table
      buildSectionTitle('Cargo Details'),
      buildCargoTable(
        data.cargo.map(c => ({
          CargoType: c.cargoType || '',
          ContainerType: c.containerType || '',
          NoofContainers: c.noOfContainers || 0,
          NoOfPackage: c.noOfPackage || 0,
          GrossWeight: c.grossWeight || 0,
          Volume: c.volume || 0,
          ChargeableWeight: c.chargeableWeight || 0,
          ShipmentTerms: c.shipmentTerms || ''
        })),
        data.fclLcl
      ),

      // Product Details (if available)
      ...(data.products && data.products.length > 0 ? [
        buildSectionTitle('Product Details'),
        buildProductTable(data.products.map(p => ({
          ProductName: p.productName || '',
          HSCode: p.hsCode || '',
          GrossWeight: p.grossWeight || 0,
          NetWeight: p.netWeight || 0,
          Volume: p.volume || 0
        })))
      ] : []),

      // Terms (if available)
      ...(data.terms && data.terms.length > 0 ? [
        buildTermsSection(data.terms)
      ] : []),

      // Signature section
      buildBookingSignature(data),

      // Thank you message
      buildThankYouSection()
    ],
    footer: createFooterFunction(data.userData),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

/**
 * Build booking information section (two columns)
 */
function buildBookingInfo(data: BookingPdfData): any {
  const booking = data.booking;

  const leftItems = [
    { label: 'Customer', value: booking?.customerName || '' },
    { label: 'Address', value: booking?.customerAddress || '' }
  ].filter(item => item.value);

  const rightItems = [
    { label: 'Booking No', value: booking?.bookingNo || '' },
    { label: 'Booking Date', value: formatDate(booking?.bookingDate) },
    { label: 'Cut Off Date', value: formatDate(booking?.cutOffDate) }
  ];

  if (booking?.quotationNumber) {
    rightItems.push({ label: 'Quotation No', value: booking.quotationNumber });
  }

  return buildTwoColumnInfo(
    leftItems.filter(i => i.value),
    rightItems.filter(i => i.value),
    { labelWidth: 100 }
  );
}

/**
 * Build shipment details section
 */
function buildShipmentDetails(data: BookingPdfData): any {
  const booking = data.booking;
  const route = data.route;

  const leftDetails: any[] = [];
  const rightDetails: any[] = [];

  // Left column
  if (booking?.vesselName || booking?.voyageNo) {
    leftDetails.push({
      label: 'Vessel/Voyage',
      value: [booking.vesselName, booking.voyageNo].filter(Boolean).join(' / ')
    });
  }

  if (route?.pol) {
    leftDetails.push({
      label: 'Port of Loading',
      value: formatPort(route.pol)
    });
  }

  if (route?.pod) {
    leftDetails.push({
      label: 'Port of Discharge',
      value: formatPort(route.pod)
    });
  }

  if (route?.fpd && formatPort(route.fpd) !== formatPort(route.pod)) {
    leftDetails.push({
      label: 'Final Destination',
      value: formatPort(route.fpd)
    });
  }

  if (booking?.shipperName) {
    leftDetails.push({ label: 'Shipper', value: booking.shipperName });
  }

  if (booking?.incoTerms) {
    leftDetails.push({ label: 'Inco Terms', value: booking.incoTerms });
  }

  // Right column
  if (booking?.hblNo) {
    rightDetails.push({
      label: data.fclLcl === 'AIR' ? 'HAWB No' : 'HBL No',
      value: booking.hblNo
    });
  }

  if (booking?.polEtd) {
    rightDetails.push({ label: 'POL ETD', value: formatDate(booking.polEtd) });
  }

  if (booking?.podEta) {
    rightDetails.push({ label: 'POD ETA', value: formatDate(booking.podEta) });
  }

  if (booking?.consigneeName) {
    rightDetails.push({ label: 'Consignee', value: booking.consigneeName });
  }

  if (booking?.carrierName) {
    rightDetails.push({ label: 'Carrier', value: booking.carrierName });
  }

  if (booking?.freightTerms) {
    rightDetails.push({ label: 'Freight Terms', value: booking.freightTerms });
  }

  if (booking?.destinationAgent) {
    rightDetails.push({ label: 'Destination Agent', value: booking.destinationAgent });
  }

  return buildTwoColumnInfo(leftDetails, rightDetails, { labelWidth: 110 });
}

/**
 * Build booking signature section
 */
function buildBookingSignature(data: BookingPdfData): any {
  return {
    stack: [
      {
        text: "Your's Sincerely,",
        style: 'labelBold',
        margin: [0, 20, 0, 10]
      },
      {
        text: data.userData?.userName || ''
      }
    ]
  };
}

/**
 * Build thank you section
 */
function buildThankYouSection(): any {
  return {
    text: 'IF YOU REQUIRE ANY FURTHER INFORMATION, PLEASE DO NOT HESITATE TO CONTACT US.\nTHANK YOU FOR SHIPPING WITH US.',
    alignment: 'center',
    margin: [0, 20, 0, 0],
    fontSize: 9
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
      buildHeader(data.company, data.branch, data.logo),

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
  return port.portCode ? `${port.portName} (${port.portCode})` : port.portName;
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
  }
): BookingPdfData {
  const booking = apiData;
  const bookingCargo = booking.bookingCargo || [];
  const bookingProducts = booking.bookingProduct || [];
  const bookingOthers = booking.bookingOthers?.[0] || {};

  // Helper to get port info
  const getPortInfo = (portName: string, portCode?: string) => {
    if (!portName) return undefined;
    return { portName, portCode: portCode || '' };
  };

  return {
    company: {
      companyName: company?.companyName || '',
      addressLine1: company?.addressLine1 || company?.Address || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || '',
      postalCode: company?.postal_code || company?.ZipCode || '',
      phoneNumber: company?.phoneNumber || company?.Phone || ''
    },
    branch: {
      branchName: branch?.branchName || '',
      addressLine1: branch?.addressLine1 || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || '',
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster
    },
    userData: {
      userName: userData?.userName || '',
      email: userData?.email || ''
    },
    logo,
    booking: {
      bookingNo: booking.BookingNo || '',
      bookingDate: booking.BookingDateTime || booking.BookingDate,
      cutOffDate: booking.voyageDetails?.PortCutoff,
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
      polEta: booking.voyageDetails?.POLETA,
      polEtd: booking.voyageDetails?.POLETD,
      podEta: booking.ETA,
      fpdEta: booking.FPDETA,
      incoTerms: booking.IncoTerms || '',
      freightTerms: booking.FreightTerms || '',
      handOverTo: bookingOthers.YardCFS || '',
      destinationAgent: booking.DestinationAgentName || '',
      remarks: booking.InternalNote || ''
    },
    route: {
      pol: getPortInfo(booking.POL),
      pod: getPortInfo(booking.POD),
      fpd: getPortInfo(booking.FPD)
    },
    cargo: bookingCargo.map((cargo: any) => ({
      cargoType: cargo.CargoType || '',
      containerType: cargo.ContainerType || '',
      noOfContainers: cargo.NoofContainers || 0,
      noOfPackage: cargo.NoOfPackage || 0,
      grossWeight: cargo.GrossWeight || 0,
      netWeight: cargo.NetWeight || 0,
      volume: cargo.Volume || 0,
      chargeableWeight: cargo.ChargeableWeight || 0,
      shipmentTerms: cargo.ShipmentTerms || ''
    })),
    products: bookingProducts.map((product: any) => ({
      productName: product.ProductName || '',
      hsCode: product.HSCode || '',
      description: product.Description || '',
      quantity: product.Quantity || 0,
      grossWeight: product.GrossWeight || 0,
      netWeight: product.NetWeight || 0,
      volume: product.Volume || 0
    })),
    terms: (booking.terms || []).map((term: any) => ({
      content: term.TandC || term.content || ''
    })),
    fclLcl: booking.FCLLCL || 'LCL',
    departmentName: booking.DepartmentName || ''
  };
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
      phoneNumber: company?.phoneNumber || ''
    },
    branch: {
      branchName: branch?.branchName || '',
      addressLine1: branch?.addressLine1 || '',
      cityName: branch?.cityMaster?.cityName || '',
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster
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
