/**
 * Enquiry PDF Generator
 * Generates Enquiry PDFs with route and cargo information
 */

import { EnquiryPdfData } from '../interfaces/pdf-document.interfaces';
import { buildCompanyHeader } from '../builders/pdf-header.builder';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { buildTwoColumnInfo } from '../builders/pdf-table.builder';
import {
  buildTitle,
  buildSectionTitle,
  buildDivider,
  buildRemarks
} from '../builders/pdf-section.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS } from '../styles/pdf-styles';
import { formatDate, formatNumber, joinNonEmpty } from '../helpers/pdf-formatters';

const ENQUIRY_LINE_WIDTH = 0.25;

/**
 * IsStackable is Char(1) 'Y'/'N' in the API but a boolean in the entry form, so accept
 * both shapes. Only stackable cargo is printed.
 */
function isCargoStackable(value: any): boolean {
  return value === true || value === 'Y' || value === 'y' || value === 1 || value === '1';
}

/**
 * Generate enquiry PDF document definition
 */
export function generateEnquiryDocument(data: EnquiryPdfData): any {
  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || [20, 20, 20, 30],
    
      background: function (currentPage, pageSize) {
      return {
        canvas: [
          // LEFT BORDER
          { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: ENQUIRY_LINE_WIDTH },
          // RIGHT BORDER
          { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: ENQUIRY_LINE_WIDTH },
          // TOP BORDER
          { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: ENQUIRY_LINE_WIDTH },
          // BOTTOM BORDER
          { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: ENQUIRY_LINE_WIDTH }
        ]
      };
    },

    content: [
      // Header
      buildCompanyHeader(data),

      // Title
      buildTitle('ENQUIRY', {
        lineWidth: 555,
        lineThickness: ENQUIRY_LINE_WIDTH,
        linePadding: -10,
        margin: [0, 0, 0, 6],
        fontSize: 8
      }),

      // Enquiry Info (two columns)
      buildEnquiryInfo(data),

      // Divider
      buildDivider({ width: 575, thickness: ENQUIRY_LINE_WIDTH, margin: [-10, 2, -10, 2] }),

      // Cargo Table(s)
      ...buildCargoSection(data),

      // Remarks
      buildRemarks(data.enquiry?.remarks || '', { title: 'Enquiry Remarks', labelWidth: 80, margin: [5, 2, 0, 6] , fontSize:7}),
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
      margin: [30, 0, 30, 5]
    }),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

/**
 * Build enquiry information section
 */
function buildEnquiryInfo(data: EnquiryPdfData): any {
  const enquiry = data.enquiry;
  const firstRoute = data.routes?.[0];

  const leftItems = [
    { label: 'Dept', value: data.departmentName || '' },
    { label: 'Enquiry Number', value: enquiry?.enquiryNumber || '' },
    { label: 'Party Name', value: enquiry?.customerName || '' },
    { label: 'Party Address', value: enquiry?.customerAddress || '' },
    { label: 'Received Date', value: formatDate(enquiry?.enquiryDate) },
    { label: 'Inco Terms', value: enquiry?.incoTerms || '' },
    // { label: 'Freight Terms', value: enquiry?.freightTerms || '' },
    // { label: 'Shipment Type', value: enquiry?.shipmentType || '' },
    // { label: 'Email', value: enquiry?.email || '' }
  ];

  const rightItems = [
    { label: 'Shipper Name', value: enquiry?.shipperName || '' },
    { label: 'Shipper Address', value: enquiry?.shipperAddress || '' },
    // { label: 'Consignee Name', value: enquiry?.consigneeName || '' },
    // { label: 'Consignee Address', value: enquiry?.consigneeAddress || '' },
    { label: 'Enquiry Created By', value: enquiry?.createdBy || '' },
    { label: 'Enquiry Created Date', value: formatDate(enquiry?.createdOn) },
    { label: 'Contact / Number', value: joinNonEmpty([enquiry?.contactPerson, enquiry?.contactNumber], ' / ') },
    { label: 'Expected Shipment Date', value: formatDate(enquiry?.shipmentDate) },

    // { label: 'Salesman', value: enquiry?.salesmanName || '' },
    // { label: 'Enquiry Type', value: enquiry?.enquiryType || '' },
    // { label: 'Clearance By', value: enquiry?.clearanceBy || '' },
    // { label: 'Transport By', value: enquiry?.transportBy || '' },
    // { label: 'Customer Ref', value: enquiry?.customerRef || '' },
    // { label: 'Pickup Address', value: enquiry?.pickupAddress || '' },
    // { label: 'Additional Service', value: enquiry?.additionalService || '' },
    // { label: 'Mode of BL', value: enquiry?.modeOfBl || '' },
    // { label: 'Shipment Frequency', value: enquiry?.shipmentFreq || '' }
  ];

  return buildTwoColumnInfo(leftItems, rightItems, {
    labelWidth: 50,
    leftLabelWidth: 65,
    rightLabelWidth: 90,
    margin: [5, 6, 5, 6],
    columnGap: 4,
    rowGap: 6,
    fontSize: 8
  });
}

/**
 * Build cargo section with tables
 */
function buildCargoSection(data: EnquiryPdfData): any[] {
  const content: any[] = [];
  const routes = data.routes || [];

  // No routes at all, so there is no port summary to hang a table off. Print a bare header
  // with a No Record row.
  if (routes.length === 0) {
    content.push(buildEmptyCargoTable(data.fclLcl));
    return content;
  }

  routes.forEach((route, routeIndex) => {
    const cargoData = (route.cargo || []).map(cargo => ({
      CargoType: cargo.cargoType || '',
      CargoDesc: cargo.cargoDescription || '',
      ProductName: cargo.productName || '',
      ContainerType: cargo.containerType || '',
      NoofContainers: cargo.noOfContainers ?? cargo.packageQty ?? cargo.noOfPackage ?? 0,
      NoOfPackage: cargo.packageQty || cargo.noOfPackage || 0,
      Qty: cargo.packageQty || cargo.noOfPackage || 0,
      Dims: formatDimensions(cargo),
      GrossWeight: cargo.grossWeight || 0,
      NetWeight: cargo.netWeight || 0,
      Volume: cargo.volume || 0,
      ChargeableWeight: cargo.chargeableWeight || 0,
      PackageType: cargo.packageType || '',
      WeightUnit: cargo.weightUnit || ''
    }));

    if (routeIndex > 0) {
      content.push(buildDivider({ width: 575, thickness: ENQUIRY_LINE_WIDTH, margin: [-10, 2, -10, 2] }));
    }

    // The route's ports and terms still describe the enquiry even when every cargo row on it
    // was filtered out as non-stackable, so only the table body falls back to No Record.
    content.push(buildRoutePortSummary(route, routeIndex === 0));
    content.push(
      cargoData.length > 0
        ? buildEnquiryCargoTable(cargoData, data.fclLcl)
        : buildEmptyCargoTable(data.fclLcl)
    );
    content.push(buildRouteTermsSection(route.terms || []));
  });

  return content;
}

function getTermDisplayText(term: any): string {
  return (term?.content || term?.TandC || term?.Terms || '').trim();
}

function buildRouteTermsSection(terms: any[]): any {
  const termValues = (terms || [])
    .map(term => getTermDisplayText(term))
    .filter(Boolean);

  if (termValues.length === 0) {
    return { text: '', margin: [0, 0, 0, 0] };
  }

  return {
    stack: [
      { text: 'Terms and Conditions', bold: true, fontSize: 7, margin: [0, 3, 0, 2] },
      {
        ul: termValues.map(term => ({
          text: term,
          fontSize: 7,
          margin: [0, 1, 0, 1]
        })),
        margin: [10, 0, 0, 4]
      }
    ],
    margin: [5, 0, 5, 2]
  };
}

function buildEnquiryCargoTable(cargo: any[], fclLcl: 'FCL' | 'LCL' | 'AIR' | 'ROAD'): any {
  const mode = fclLcl || 'LCL';
  const columns = getEnquiryCargoColumns(mode);

  const formatCellValue = (value: any, decimals?: number) => {
    if (decimals === undefined) {
      return value !== null && value !== undefined ? String(value) : '';
    }

    if (value === null || value === undefined || value === '') {
      return '';
    }

    return formatNumber(value, decimals);
  };

  const dataRows = cargo.map(row =>
    columns.map(col => ({
      text: formatCellValue(row[col.field], col.decimals),
      style: 'tableCell',
      alignment: col.alignment,
      fontSize: 7
    }))
  );

  const totalRow = buildCargoTotalRow(cargo, columns, mode);

  return buildCargoTableShell(columns, [...dataRows, totalRow]);
}

function buildCargoHeaderRow(columns: any[]): any[] {
  return columns.map(col => ({
    text: col.header,
    style: 'tableHeader',
    alignment: 'center',
    noWrap: true,
    fontSize: 7
  }));
}

function buildCargoTableShell(columns: any[], bodyRows: any[]): any {
  return {
    table: {
      headerRows: 1,
      widths: columns.map(col => col.width),
      body: [buildCargoHeaderRow(columns), ...bodyRows]
    },
    layout: {
      ...PDF_TABLE_LAYOUTS.bordered,
      hLineWidth: () => ENQUIRY_LINE_WIDTH,
      vLineWidth: () => ENQUIRY_LINE_WIDTH
    },
    margin: [-10, 4, -10, 3]
  };
}

/**
 * Header row plus a single full-width "No Record" row, used when no stackable cargo exists.
 */
function buildEmptyCargoTable(fclLcl: 'FCL' | 'LCL' | 'AIR' | 'ROAD'): any {
  const columns = getEnquiryCargoColumns(fclLcl || 'LCL');

  // pdfmake needs a placeholder cell for every column the colSpan swallows.
  const noRecordRow = columns.map((_, index) =>
    index === 0
      ? { text: 'No Record', colSpan: columns.length, style: 'tableCellBold', alignment: 'center', fontSize: 7, margin: [0, 3, 0, 3] }
      : {}
  );

  return buildCargoTableShell(columns, [noRecordRow]);
}

function getEnquiryCargoColumns(mode: 'FCL' | 'LCL' | 'AIR' | 'ROAD'): any[] {
  const baseColumns = [
    { header: 'Cargo Type', field: 'CargoType', width: 50, alignment: 'left' },
    { header: 'Cargo Desc', field: 'CargoDesc', width: '*', alignment: 'left' },
    { header: 'Product Name', field: 'ProductName', width: 62, alignment: 'left' }
  ];

  if (mode === 'AIR') {
    return [
      ...baseColumns,
      { header: 'Pkg Type', field: 'PackageType', width: 46, alignment: 'left' },
      { header: 'No. of Pkg', field: 'NoOfPackage', width: 46, alignment: 'right', decimals: 0 },
      { header: 'Dims', field: 'Dims', width: 88, alignment: 'right' },
      { header: 'Gross Wt.', field: 'GrossWeight', width: 52, alignment: 'right', decimals: 3 },
      { header: 'Chargeable Wt.', field: 'ChargeableWeight', width: 65, alignment: 'right', decimals: 3 }
    ];
  }

  if (mode === 'FCL') {
    return [
      ...baseColumns,
      { header: 'Cont. Type', field: 'ContainerType', width: 58, alignment: 'left' },
      { header: 'No. of Cont.', field: 'NoofContainers', width: 50, alignment: 'right', decimals: 0 },
      { header: 'Pkg Type', field: 'PackageType', width: 50, alignment: 'left' },
      { header: 'Gross Wt.', field: 'GrossWeight', width: 55, alignment: 'right', decimals: 3 },
      { header: 'CBM', field: 'Volume', width: 45, alignment: 'right', decimals: 3 }
    ];
  }

  if (mode === 'ROAD') {
    return [
      ...baseColumns,
      { header: 'No. of Pkg', field: 'Qty', width: 48, alignment: 'right', decimals: 0 },
      { header: 'Gross Wt.', field: 'GrossWeight', width: 52, alignment: 'right', decimals: 3 },
      { header: 'Net Wt.', field: 'NetWeight', width: 50, alignment: 'right', decimals: 3 },
      { header: 'CBM', field: 'Volume', width: 45, alignment: 'right', decimals: 3 },
      { header: 'Chargeable Wt.', field: 'ChargeableWeight', width: 65, alignment: 'right', decimals: 3 }
    ];
  }

  return [
    ...baseColumns,
    { header: 'No. of Pkg', field: 'NoOfPackage', width: 48, alignment: 'right', decimals: 2 },
    { header: 'Dims', field: 'Dims', width: 88, alignment: 'right' },
    { header: 'Pkg Type', field: 'PackageType', width: 48, alignment: 'left' },
    { header: 'Gross Wt.', field: 'GrossWeight', width: 55, alignment: 'right', decimals: 3 },
    { header: 'CBM', field: 'Volume', width: 45, alignment: 'right', decimals: 3 }
  ];
}

function buildCargoTotalRow(cargo: any[], columns: any[], mode: 'FCL' | 'LCL' | 'AIR' | 'ROAD'): any[] {
  const totalRow: any[] = columns.map(() => ({ text: '', style: 'tableCell' }));
  const setTotalCell = (field: string, value: number, decimals = 3) => {
    const index = columns.findIndex(column => column.field === field);
    if (index >= 0) {
      totalRow[index] = { text: formatNumber(value, decimals), style: 'tableCellBold', alignment: 'right' , fontSize: 7 };
    }
  };
  const labelIndex = mode === 'AIR'
    ? columns.findIndex(column => column.field === 'Dims')
    : columns.findIndex(column => column.field === 'PackageType');

  if (labelIndex >= 0) {
    totalRow[labelIndex] = { text: 'Total', style: 'tableCellBold', alignment: 'right' };
  }

  setTotalCell('GrossWeight', cargo.reduce((sum, item) => sum + (Number(item.GrossWeight) || 0), 0));

  if (mode === 'AIR') {
    setTotalCell('ChargeableWeight', cargo.reduce((sum, item) => sum + (Number(item.ChargeableWeight) || 0), 0));
  } else if (mode === 'ROAD') {
    setTotalCell('NetWeight', cargo.reduce((sum, item) => sum + (Number(item.NetWeight) || 0), 0));
  } else {
    setTotalCell('Volume', cargo.reduce((sum, item) => sum + (Number(item.Volume) || 0), 0));
  }

  return totalRow;
}

function formatDimensions(cargo: any): string {
  const length = cargo.length ?? 0;
  const width = cargo.width ?? 0;
  const height = cargo.height ?? 0;
  const unit = cargo.weightUnit || '';

  return `${length} x ${width} x ${height}${unit ? ` ${unit}` : ''}`;
}

function buildRoutePortSummary(route: EnquiryPdfData['routes'][number], isFirstRoute = false): any {
  const item = (label: string, value: string) => ({
    stack: [
      { text: label, style: 'labelBold', margin: [0, 0, 0, 2], fontSize:8 },
      { text: value || '-', noWrap: true }
    ],
    margin: [0, 0, 10, 0]
  });

  return {
    columns: [
      item('POO', formatPort(route.poo)),
      item('POL', formatPort(route.pol)),
      item('POD', formatPort(route.pod)),
      {
        stack: [
          { text: 'FPOD', style: 'labelBold', margin: [0, 0, 0, 2] },
          { text: formatPort(route.fpd) || '-', noWrap: true }
        ],
        margin: [0, 0, 0, 0]
      }
    ],
    columnGap: 0,
    fontSize:7,
    margin: [5, isFirstRoute ? 6 : 8, 5, 3]
  };
}

/**
 * Calculate cargo totals
 */
function calculateCargoTotals(cargo: any[]): any {
  return {
    totalQty: cargo.reduce((sum, c) => sum + (Number(c.noOfContainers) || Number(c.packageQty) || 0), 0),
    totalPackages: cargo.reduce((sum, c) => sum + (Number(c.packageQty) || Number(c.noOfPackage) || 0), 0),
    totalGrossWeight: cargo.reduce((sum, c) => sum + (Number(c.grossWeight) || 0), 0),
    totalNetWeight: cargo.reduce((sum, c) => sum + (Number(c.netWeight) || 0), 0),
    totalVolume: cargo.reduce((sum, c) => sum + (Number(c.volume) || 0), 0),
    totalChargeableWeight: cargo.reduce((sum, c) => sum + (Number(c.chargeableWeight) || 0), 0)
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
 * Transform API data to EnquiryPdfData format
 */
export function transformEnquiryApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  lookups?: {
    ports?: any[];
    departments?: any[];
    salesmen?: any[];
    measurementUnits?: any[];
  },
  options?: {
    routeTandCMap?: Record<string, any[]>;
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  }
): EnquiryPdfData {
  const enquiry = apiData;
  const routes = enquiry.enquiryRoute || [];
  const enquiryOther = enquiry.enquiryOther?.[0];
  // Helper to get port info
  const getPortInfo = (portId: number) => {
    if (!portId || !lookups?.ports) return undefined;
    const port = lookups.ports.find(p => p.PortMasterSid === portId);
    return port ? { portName: port.PortName || '', portCode: port.PortCode || '' } : undefined;
  };

  // Get salesman name
  const getSalesmanName = (userId: number) => {
    if (!userId || !lookups?.salesmen) return '';
    const salesman = lookups.salesmen.find(s => s.UserMasterSid === userId);
    return salesman?.userName || '';
  };

  // Get department name
  const getDeptName = (deptId: number) => {
    if (!deptId || !lookups?.departments) return '';
    const dept = lookups.departments.find(d => d.DepartmentMasterSid === deptId);
    return dept?.departmentName || '';
  };

  const getMeasurementUnitCode = (uomId: number) => {
    if (!uomId) return '';
    const measurementUnit = (lookups?.measurementUnits || []).find(unit => Number(unit.id) === Number(uomId));
    if (measurementUnit?.name) return measurementUnit.name;

    const fallbackUnits: Record<number, string> = {
      1: 'M',
      2: 'CM',
      3: 'Inch'
    };

    return fallbackUnits[Number(uomId)] || '';
  };

  const shipmentType = (enquiry.ShipmentType || '').toUpperCase();
  const deptName = (getDeptName(enquiry.DepartmentMasterSid) || enquiry.DepartmentName || '').toUpperCase();
  const fclLclRaw = (enquiry.FCLLCL || routes[0]?.FCLLCL || '').toUpperCase();
  const detectMode = (value: string) => {
    if (value.includes('FCL')) return 'FCL';
    if (value.includes('LCL')) return 'LCL';
    if (value.includes('AIR')) return 'AIR';
    if (value.includes('ROAD')) return 'ROAD';
    return '';
  };
  const fclLcl = (detectMode(fclLclRaw) || detectMode(shipmentType) || detectMode(deptName) || 'LCL') as 'FCL' | 'LCL' | 'AIR' | 'ROAD';

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
    printSettings: options?.printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
    enquiry: {
      enquiryNumber: enquiry.EnquiryNumber || '',
      enquiryDate: enquiry.EnquiryDate || enquiry.CreatedDate,
      customerName: enquiry.CustomerName || enquiry.PreCustomerName || '',
      customerAddress: enquiry.CustomerAddress || '',
      contactPerson: enquiry.ContactPerson || '',
      contactNumber: enquiry.ContactNumber || '',
      email: enquiry.Email || '',
      salesmanName: getSalesmanName(enquiry.UserMasterSid) || enquiry.SalesmanName || '',
      enquiryType: enquiry.EnquiryType || '',
      shipmentDate: enquiry.ShipmentDate || enquiry.ShipmentExpectedDate,
      incoTerms: enquiry.IncoTerms || '',
      freightTerms: enquiry.FreightPPCC || enquiry.FreightTerms || enquiryOther?.FreightTerms || '',
      remarks: enquiry.Remarks || '',
      shipmentType: enquiry.ShipmentType || '',
      clearanceBy: enquiry.ClearanceBy || '',
      transportBy: enquiry.TransportBy || '',
      customerRef: enquiry.CustomerRef || '',
      createdBy: enquiry.createdBy || '',
      createdOn: enquiry.EnquiryDate || enquiry.createdOn || '',
      shipperName: enquiryOther?.ShipperName || '',
      shipperAddress: enquiryOther?.ShipperAddress || '',
      consigneeName: enquiryOther?.ConsigneeName || '',
      consigneeAddress: enquiryOther?.ConsigneeAddress || '',
      pickupAddress: enquiryOther?.PickupAddress || '',
      additionalService: enquiryOther?.AdditionalService || '',
      modeOfBl: enquiryOther?.ModeofBL || '',
      shipmentFreq: enquiryOther?.ShipmentFreq || ''
    },
    routes: routes.map((route: any) => ({
      poo: getPortInfo(route.POOSid || route.PORSid),
      pol: getPortInfo(route.POLSid),
      pod: getPortInfo(route.PODSid),
      fpd: getPortInfo(route.FDPSid || route.FDCSid),
      terms: (options?.routeTandCMap?.[String(route.EnquiryRouteSid)] || []).map((term: any) => ({
        content: getTermDisplayText(term)
      })),
      cargo: (route.enquiryCargo || [])
        .filter((cargo: any) => isCargoStackable(cargo.IsStackable))
        .map((cargo: any) => ({
        cargoType: cargo.CargoType || '',
        cargoDescription: cargo.CargoDescription || '',
        productName: cargo.ProductName || '',
        containerType: cargo.ContainerType || '',
        noOfContainers: cargo.PackageQty || cargo.NoofContainers || cargo.ContainerQty || cargo.Qty || 0,
        noOfPackage: cargo.NoOfPackage || cargo.PackageQty || cargo.Qty || 0,
        packageQty: cargo.PackageQty || cargo.Qty || 0,
        length: cargo.length || cargo.Length || 0,
        width: cargo.width || cargo.Width || 0,
        height: cargo.height || cargo.Height || 0,
        grossWeight: cargo.GrossWeight || 0,
        netWeight: cargo.NetWeight || 0,
        volume: cargo.Volume || 0,
        chargeableWeight: cargo.ChargeableWeight || 0,
        packageType: cargo.PackageType || '',
        weightUnit: cargo.WeightUnit || cargo.UOMCode || cargo.WeightUnitCode || getMeasurementUnitCode(cargo.WeightUnitSid)
      }))
    })),
    fclLcl,
    departmentName: getDeptName(enquiry.DepartmentMasterSid) || enquiry.DepartmentName || ''
  };
}
