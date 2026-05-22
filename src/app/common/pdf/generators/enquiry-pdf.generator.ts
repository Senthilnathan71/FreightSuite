/**
 * Enquiry PDF Generator
 * Generates Enquiry PDFs with route and cargo information
 */

import { EnquiryPdfData } from '../interfaces/pdf-document.interfaces';
import { buildHeader } from '../builders/pdf-header.builder';
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
          { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.8 },
          // RIGHT BORDER
          { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.8 },
          // TOP BORDER
          { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.8 },
          // BOTTOM BORDER
          { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.8 }
        ]
      };
    },

    content: [
      // Header
      buildHeader(data.company, data.branch, data.logo),

      // Title
      buildTitle('ENQUIRY', {
        lineWidth: 555,
        linePadding: -10,
        margin: [0, 0, 0, 6]
      }),

      // Enquiry Info (two columns)
      buildEnquiryInfo(data),

      // Divider
      buildDivider({ width: 575, margin: [-10, 2, -10, 2] }),

      // Cargo Table(s)
      ...buildCargoSection(data),

      // Remarks
      buildRemarks(data.enquiry?.remarks || '', { title: 'Enquiry Remarks', labelWidth: 105, margin: [0, 2, 0, 6] }),
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
    labelWidth: 110,
    leftLabelWidth: 95,
    rightLabelWidth: 120,
    margin: [5, 6, 5, 6],
    columnGap: 4,
    rowGap: 6,
    fontSize: 10
  });
}

/**
 * Build cargo section with tables
 */
function buildCargoSection(data: EnquiryPdfData): any[] {
  const content: any[] = [];
  const routes = data.routes || [];
  const routesWithCargo = routes.filter(route => (route.cargo || []).length > 0);

  if (routesWithCargo.length === 0) {
    return content;
  }

  routesWithCargo.forEach((route, routeIndex) => {
    const cargoData = (route.cargo || []).map(cargo => ({
      CargoType: cargo.cargoType || '',
      CargoDesc: cargo.cargoDescription || '',
      ProductName: cargo.productName || '',
      ContainerType: cargo.containerType || '',
      NoofContainers: cargo.noOfContainers ?? cargo.packageQty ?? cargo.noOfPackage ?? 0,
      NoOfPackage: cargo.packageQty || cargo.noOfPackage || 0,
      Qty: cargo.packageQty || cargo.noOfPackage || 0,
      GrossWeight: cargo.grossWeight || 0,
      NetWeight: cargo.netWeight || 0,
      Volume: cargo.volume || 0,
      ChargeableWeight: cargo.chargeableWeight || 0,
      PackageType: cargo.packageType || '',
      WeightUnit: cargo.weightUnit || ''
    }));

    if (routeIndex > 0) {
      content.push(buildDivider({ width: 575, margin: [-10, 2, -10, 2] }));
    }

    content.push(buildRoutePortSummary(route, routeIndex === 0));
    content.push(buildEnquiryCargoTable(cargoData, data.fclLcl));
  });

  return content;
}

function buildEnquiryCargoTable(cargo: any[], fclLcl: 'FCL' | 'LCL' | 'AIR'): any {
  const isFcl = fclLcl === 'FCL';
  const columns = isFcl
    ? [
        { header: 'Cargo Type', field: 'CargoType', width: 62, alignment: 'left' },
        { header: 'Cargo Desc', field: 'CargoDesc', width: '*', alignment: 'left' },
        { header: 'Product Name', field: 'ProductName', width: 70, alignment: 'left' },
        { header: 'Cont. Type', field: 'ContainerType', width: 58, alignment: 'left' },
        { header: 'No. of Cont.', field: 'NoofContainers', width: 50, alignment: 'right', decimals: 0 },
        { header: 'Pkg Type', field: 'PackageType', width: 55, alignment: 'left' },
        { header: 'Gross Wt.', field: 'GrossWeight', width: 58, alignment: 'right', decimals: 3 },
        { header: 'CBM', field: 'Volume', width: 50, alignment: 'right', decimals: 3 }
      ]
    : [
        { header: 'Cargo Type', field: 'CargoType', width: 50, alignment: 'left' },
        { header: 'Cargo Desc', field: 'CargoDesc', width: '*', alignment: 'left' },
        { header: 'Product Name', field: 'ProductName', width: 67, alignment: 'left' },
        { header: 'Chargeable Wt.', field: 'ChargeableWeight', width: 72, alignment: 'right', decimals: 0 },
        { header: 'Qty.', field: 'Qty', width: 42, alignment: 'right', decimals: 2 },
        { header: 'Wt. Unit', field: 'WeightUnit', width: 43, alignment: 'left' },
        { header: 'Pkg Type', field: 'PackageType', width: 45, alignment: 'left' },
        { header: 'Gross Wt.', field: 'GrossWeight', width: 55, alignment: 'right', decimals: 3 },
        { header: 'CBM', field: 'Volume', width: 43, alignment: 'right', decimals: 3 }
      ];

  const formatCellValue = (value: any, decimals?: number) => {
    if (decimals === undefined) {
      return value !== null && value !== undefined ? String(value) : '';
    }

    if (value === null || value === undefined || value === '') {
      return '';
    }

    return formatNumber(value, decimals);
  };

  const headerRow = columns.map(col => ({
    text: col.header,
    style: 'tableHeader',
    alignment: 'center',
    noWrap: true
  }));

  const dataRows = cargo.map(row =>
    columns.map(col => ({
      text: formatCellValue(row[col.field], col.decimals),
      style: 'tableCell',
      alignment: col.alignment
    }))
  );

  const totalGrossWeight = cargo.reduce((sum, item) => sum + (Number(item.GrossWeight) || 0), 0);
  const totalVolume = cargo.reduce((sum, item) => sum + (Number(item.Volume) || 0), 0);
  const totalRow: any[] = columns.map(() => ({ text: '', style: 'tableCell' }));
  const totalLabelIndex = isFcl ? 5 : 6;
  const grossWeightIndex = isFcl ? 6 : 7;
  const volumeIndex = isFcl ? 7 : 8;

  totalRow[totalLabelIndex] = { text: 'Total', style: 'tableCellBold', alignment: 'right' };
  totalRow[grossWeightIndex] = { text: formatNumber(totalGrossWeight, 3), style: 'tableCellBold', alignment: 'right' };
  totalRow[volumeIndex] = { text: formatNumber(totalVolume, 3), style: 'tableCellBold', alignment: 'right' };

  return {
    table: {
      headerRows: 1,
      widths: columns.map(col => col.width),
      body: [headerRow, ...dataRows, totalRow]
    },
    layout: PDF_TABLE_LAYOUTS.bordered,
    margin: [-10, 4, -10, 3]
  };
}

function buildRoutePortSummary(route: EnquiryPdfData['routes'][number], isFirstRoute = false): any {
  const item = (label: string, value: string) => ({
    stack: [
      { text: label, style: 'labelBold', margin: [0, 0, 0, 2] },
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
    columnGap: 8,
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

  const shipmentType = (enquiry.ShipmentType || '').toUpperCase();
  const deptName = (getDeptName(enquiry.DepartmentMasterSid) || enquiry.DepartmentName || '').toUpperCase();
  const fclLclRaw = (enquiry.FCLLCL || routes[0]?.FCLLCL || '').toUpperCase();
  const detectMode = (value: string) => {
    if (value.includes('FCL')) return 'FCL';
    if (value.includes('LCL')) return 'LCL';
    if (value.includes('AIR')) return 'AIR';
    return '';
  };
  const fclLcl = (detectMode(fclLclRaw) || detectMode(shipmentType) || detectMode(deptName) || 'LCL') as 'FCL' | 'LCL' | 'AIR';

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
      createdOn: enquiry.createdOn || '',
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
      cargo: (route.enquiryCargo || []).map((cargo: any) => ({
        cargoType: cargo.CargoType || '',
        cargoDescription: cargo.CargoDescription || '',
        productName: cargo.ProductName || '',
        containerType: cargo.ContainerType || '',
        noOfContainers: cargo.NoofContainers ?? cargo.ContainerQty ?? cargo.Qty ?? 0,
        noOfPackage: cargo.NoOfPackage || cargo.PackageQty || 0,
        packageQty: cargo.PackageQty || 0,
        grossWeight: cargo.GrossWeight || 0,
        netWeight: cargo.NetWeight || 0,
        volume: cargo.Volume || 0,
        chargeableWeight: cargo.ChargeableWeight || 0,
        packageType: cargo.PackageType || '',
        weightUnit: cargo.WeightUnit || ''
      }))
    })),
    fclLcl,
    departmentName: getDeptName(enquiry.DepartmentMasterSid) || enquiry.DepartmentName || ''
  };
}
