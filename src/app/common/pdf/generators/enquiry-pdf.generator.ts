/**
 * Enquiry PDF Generator
 * Generates Enquiry PDFs with route and cargo information
 */

import { EnquiryPdfData } from '../interfaces/pdf-document.interfaces';
import { buildHeader } from '../builders/pdf-header.builder';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { buildCargoTable, buildTwoColumnInfo } from '../builders/pdf-table.builder';
import {
  buildTitle,
  buildSectionTitle,
  buildDivider,
  buildRemarks
} from '../builders/pdf-section.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG } from '../styles/pdf-styles';
import { formatDate, joinNonEmpty } from '../helpers/pdf-formatters';

/**
 * Generate enquiry PDF document definition
 */
export function generateEnquiryDocument(data: EnquiryPdfData): any {
  const departmentLabel = data.departmentName ? ` - ${data.departmentName}` : '';
  const modeLabel = data.fclLcl ? ` (${data.fclLcl})` : '';

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || PDF_DEFAULT_CONFIG.pageMargins,
    content: [
      // Header
      buildHeader(data.company, data.branch, data.logo),

      // Title
      buildTitle(`Enquiry${departmentLabel}${modeLabel}`),

      // Enquiry Info (two columns)
      buildEnquiryInfo(data),

      // Divider
      buildDivider(),

      // Route Information
      ...buildRouteInfo(data),

      // Cargo Table(s)
      ...buildCargoSection(data),

      // Remarks
      buildRemarks(data.enquiry?.remarks || ''),

      // Signature area
      buildSignatureSection(data)
    ],
    footer: createFooterFunction(data.userData),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

/**
 * Build enquiry information section
 */
function buildEnquiryInfo(data: EnquiryPdfData): any {
  const enquiry = data.enquiry;

  const leftItems = [
    { label: 'Customer', value: enquiry?.customerName || '' },
    { label: 'Address', value: enquiry?.customerAddress || '' },
    { label: 'Contact Person', value: enquiry?.contactPerson || '' },
    { label: 'Contact No', value: enquiry?.contactNumber || '' },
    { label: 'Email', value: enquiry?.email || '' }
  ].filter(item => item.value);

  const rightItems = [
    { label: 'Enquiry No', value: enquiry?.enquiryNumber || '' },
    { label: 'Enquiry Date', value: formatDate(enquiry?.enquiryDate) },
    { label: 'Salesman', value: enquiry?.salesmanName || '' },
    { label: 'Enquiry Type', value: enquiry?.enquiryType || '' },
    { label: 'Shipment Date', value: formatDate(enquiry?.shipmentDate) },
    { label: 'Inco Terms', value: enquiry?.incoTerms || '' },
    { label: 'Freight Terms', value: enquiry?.freightTerms || '' }
  ].filter(item => item.value);

  return buildTwoColumnInfo(leftItems, rightItems, { labelWidth: 90 });
}

/**
 * Build route information section
 */
function buildRouteInfo(data: EnquiryPdfData): any[] {
  const content: any[] = [];
  const routes = data.routes || [];

  if (routes.length === 0) {
    return content;
  }

  content.push(buildSectionTitle('Route Information'));

  routes.forEach((route, index) => {
    const routeContent: any[] = [];

    // Route header for multiple routes
    if (routes.length > 1) {
      routeContent.push({
        text: `Route ${index + 1}`,
        style: 'subSectionTitle',
        margin: [0, index > 0 ? 10 : 0, 0, 5]
      });
    }

    // Port information
    const portInfo: any[] = [];

    if (route.poo) {
      portInfo.push({
        columns: [
          { text: 'Place of Origin', style: 'labelBold', width: 120 },
          { text: `: ${formatPort(route.poo)}`, width: '*' }
        ]
      });
    }

    if (route.pol) {
      portInfo.push({
        columns: [
          { text: 'Port of Loading', style: 'labelBold', width: 120 },
          { text: `: ${formatPort(route.pol)}`, width: '*' }
        ]
      });
    }

    if (route.pod) {
      portInfo.push({
        columns: [
          { text: 'Port of Discharge', style: 'labelBold', width: 120 },
          { text: `: ${formatPort(route.pod)}`, width: '*' }
        ]
      });
    }

    if (route.fpd) {
      portInfo.push({
        columns: [
          { text: 'Final Destination', style: 'labelBold', width: 120 },
          { text: `: ${formatPort(route.fpd)}`, width: '*' }
        ]
      });
    }

    routeContent.push({
      stack: portInfo,
      margin: [0, 0, 0, 10]
    });

    content.push(...routeContent);
  });

  return content;
}

/**
 * Build cargo section with tables
 */
function buildCargoSection(data: EnquiryPdfData): any[] {
  const content: any[] = [];
  const routes = data.routes || [];

  // Collect all cargo from all routes
  const allCargo: any[] = [];
  routes.forEach(route => {
    if (route.cargo && route.cargo.length > 0) {
      allCargo.push(...route.cargo);
    }
  });

  if (allCargo.length === 0) {
    return content;
  }

  content.push(buildSectionTitle('Cargo Details'));

  // Transform cargo data for table
  const cargoData = allCargo.map(cargo => ({
    CargoType: cargo.cargoType || '',
    ContainerType: cargo.containerType || '',
    NoofContainers: cargo.noOfContainers || 0,
    NoOfPackage: cargo.packageQty || cargo.noOfPackage || 0,
    GrossWeight: cargo.grossWeight || 0,
    NetWeight: cargo.netWeight || 0,
    Volume: cargo.volume || 0,
    ChargeableWeight: cargo.chargeableWeight || 0,
    PackageType: cargo.packageType || ''
  }));

  content.push(buildCargoTable(cargoData, data.fclLcl));

  // Add totals summary
  const totals = calculateCargoTotals(allCargo);
  content.push(buildCargoTotalsSummary(totals, data.fclLcl));

  return content;
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
 * Build cargo totals summary
 */
function buildCargoTotalsSummary(totals: any, fclLcl: string): any {
  const summaryItems: string[] = [];

  if (fclLcl === 'FCL' && totals.totalQty > 0) {
    summaryItems.push(`Total Containers: ${totals.totalQty}`);
  }

  if (fclLcl === 'LCL' && totals.totalPackages > 0) {
    summaryItems.push(`Total Packages: ${totals.totalPackages}`);
  }

  if (totals.totalGrossWeight > 0) {
    summaryItems.push(`Total Gross Weight: ${totals.totalGrossWeight.toFixed(2)} KG`);
  }

  if (totals.totalVolume > 0) {
    summaryItems.push(`Total Volume: ${totals.totalVolume.toFixed(3)} CBM`);
  }

  if (fclLcl === 'AIR' && totals.totalChargeableWeight > 0) {
    summaryItems.push(`Total Chargeable Weight: ${totals.totalChargeableWeight.toFixed(2)} KG`);
  }

  if (summaryItems.length === 0) {
    return { text: '' };
  }

  return {
    text: summaryItems.join(' | '),
    style: 'labelBold',
    alignment: 'right',
    margin: [0, 5, 0, 15]
  };
}

/**
 * Build signature section
 */
function buildSignatureSection(data: EnquiryPdfData): any {
  return {
    stack: [
      {
        text: "Your's Sincerely,",
        style: 'labelBold',
        margin: [0, 20, 0, 10]
      },
      {
        text: data.userData?.userName || '',
        margin: [0, 0, 0, 5]
      },
      {
        text: data.company?.companyName || '',
        style: 'muted'
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
      shipmentDate: enquiry.ShipmentDate,
      incoTerms: enquiry.IncoTerms || '',
      freightTerms: enquiry.FreightTerms || '',
      remarks: enquiry.Remarks || ''
    },
    routes: routes.map((route: any) => ({
      poo: getPortInfo(route.POOSid),
      pol: getPortInfo(route.POLSid),
      pod: getPortInfo(route.PODSid),
      fpd: getPortInfo(route.FDPSid || route.FDCSid),
      cargo: (route.enquiryCargo || []).map((cargo: any) => ({
        cargoType: cargo.CargoType || '',
        containerType: cargo.ContainerType || '',
        noOfContainers: cargo.NoofContainers || cargo.Qty || 0,
        noOfPackage: cargo.NoOfPackage || cargo.PackageQty || 0,
        packageQty: cargo.PackageQty || 0,
        grossWeight: cargo.GrossWeight || 0,
        netWeight: cargo.NetWeight || 0,
        volume: cargo.Volume || 0,
        chargeableWeight: cargo.ChargeableWeight || 0,
        packageType: cargo.PackageType || '',
        weightUnit: cargo.WeightUnit || 'KG'
      }))
    })),
    fclLcl: enquiry.FCLLCL || routes[0]?.FCLLCL || 'LCL',
    departmentName: getDeptName(enquiry.DepartmentMasterSid) || enquiry.DepartmentName || ''
  };
}
