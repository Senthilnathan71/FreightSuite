/**
 * Packing List PDF Generator
 * Generates Packing List PDF based on house job data
 */

import { PackingListPdfData } from '../interfaces/pdf-document.interfaces';
import { buildCompanyHeader } from '../builders/pdf-header.builder';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG } from '../styles/pdf-styles';
import { formatDate, formatNumber } from '../helpers/pdf-formatters';

function buildPackingListHeader(data: PackingListPdfData): any {
  return {
    stack: [
      buildCompanyHeader(data),
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 575,
            y2: 0,
            lineWidth: 0.25,
            lineColor: '#000000'
          }
        ],
        margin: [0, 2, 0, 0]
      }
    ],
    margin: [10, 10, 10, 0]
  };
}

export function generatePackingListDocument(data: PackingListPdfData): any {
  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || [20, 82, 20, 55],
    background: function (currentPage, pageSize) {
      return {
        canvas: [
          { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.25 },
          { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.25 },
          { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.25 },
          { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.25 }
        ]
      };
    },
    header: () => buildPackingListHeader(data),
    content: [
      {
        text: 'Packing List',
        alignment: 'center',
        bold: true,
        fontSize: 14,
        margin: [0, 0, 0, 8]
      },
      {
        stack: [
          buildPartyBlocks(data),
          buildJobDetails(data),
          buildCommodityTable(data),
          buildRemarksSection(data),
          buildPackingTermsSection(data)
        ],
        margin: [-10, 0, -10, 0]
      }
    ],
    footer: createFooterFunction(data.userData, {
      showPageNumbers: true,
      showDisclaimer: false,
      pageMargins: [15, 10, 15, 2]
    }),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function buildPartyBlocks(data: PackingListPdfData): any {
  const topRowTable = {
    table: {
      widths: ['50%', '50%'],
      body: [[
        buildPartyBox('Shipper', data.packing?.shipperName, data.packing?.shipperAddress),
        buildPartyBox('Client', data.packing?.clientName, data.packing?.clientAddress)
      ]]
    },
    layout: {
      hLineWidth: () => 0.25,
      vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 0 : 0.25),
      hLineColor: () => '#000000',
      vLineColor: () => '#000000'
    },
    margin: [0, 0, 0, 6]
  };

  const bottomRowTable = {
    table: {
      widths: ['50%', '50%'],
      body: [[
        buildPartyBox('Consignee', data.packing?.consigneeName, data.packing?.consigneeAddress),
        buildPartyBox('Shipment No.', data.packing?.shipmentNo, '')
      ]]
    },
    layout: {
      hLineWidth: () => 0.25,
      vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 0 : 0.25),
      hLineColor: () => '#000000',
      vLineColor: () => '#000000'
    },
    margin: [0, 0, 0, 6]
  };

  return {
    stack: [topRowTable, bottomRowTable]
  };
}

function buildPartyBox(title: string, line1?: string, line2?: string): any {
  const stack: any[] = [
    { text: title, style: 'labelBold', margin: [0, 0, 0, 2] }
  ];
  if (line1) stack.push({ text: line1, margin: [20, 0, 0, 4] });
  if (line2) stack.push({ text: line2, margin: [20, 0, 0, 0] });
  stack.push({ text: ' ', margin: [0, 4, 0, 0] });

  return {
    stack,
    margin: [0, 2, 0, 8]
  };
}

function buildJobDetails(data: PackingListPdfData): any {
  const leftItems = [
    { label: 'Job No.', value: data.packing?.jobNo || '' },
    { label: 'MBL No.', value: data.packing?.mblNo || '' },
    { label: 'Place of Receipt', value: data.packing?.placeOfReceipt || '' },
    { label: 'Port of Discharge', value: data.packing?.portOfDischarge || '' },
    { label: 'Place of Delivery', value: data.packing?.placeOfDelivery || '' },
    { label: 'ETA', value: formatDate(data.packing?.eta) },
    { label: 'Vessel/Voyage', value: data.packing?.vesselVoyage || '' }
  ];

  const rightItems = [
    { label: 'HBL No.', value: data.packing?.hblNo || '' },
    { label: 'Port of Loading', value: data.packing?.portOfLoading || '' },
    { label: 'Final Destination', value: data.packing?.finalDestination || '' },
    { label: 'ETD', value: formatDate(data.packing?.etd) },
    { label: 'Carrier', value: data.packing?.carrier || '' },
    { label: 'Movement Type', value: data.packing?.movementType || '' },
    { label: 'PP/CC', value: data.packing?.freightTerms || '' }
  ];

  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: buildDetailRows(leftItems, 83), margin: [6, 4, 6, 4] },
        { stack: buildDetailRows(rightItems, 83), margin: [6, 4, 6, 4] }
      ]]
    },
    layout: {
      hLineWidth: () => 0.25,
      vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 0 : 0.25),
      hLineColor: () => '#000000',
      vLineColor: () => '#000000'
    },
    margin: [0, 0, 0, 6]
  };
}

function buildDetailRows(items: Array<{ label: string; value: string }>, labelWidth: number): any[] {
  return items.map(item => ({
    columns: [
      { text: item.label, style: 'labelBold', fontSize: 10, width: labelWidth },
      { text: ':', width: 3 },
      { text: item.value || '', fontSize: 10, width: '*', margin: [2, 0, 0, 0] }
    ],
    margin: [0, 4, 0, 0]
  }));
}

function buildCommodityTable(data: PackingListPdfData): any {
  const products = data.products || [];
  const isLcl = data.selectedFclLcl === 'LCL';

  const headerRow: any[] = [
    { text: 'Commodity Description', style: 'tableHeader', alignment: 'center', bold: true }
  ];

  if (isLcl) {
    headerRow.push({ text: 'Length × Width × Height (cm)', style: 'tableHeader', alignment: 'center', bold: true });
  }

  headerRow.push(
    { text: 'Pkgs Type', style: 'tableHeader', alignment: 'center', bold: true },
    { text: 'No. of Pkgs', style: 'tableHeader', alignment: 'center', bold: true },
    { text: 'Gross Wt.', style: 'tableHeader', alignment: 'center', bold: true },
    { text: 'Volume', style: 'tableHeader', alignment: 'center', bold: true }
  );

  const dataRows = products.map(item => {
    const row: any[] = [
      { text: item?.productName || '', style: 'tableCell', alignment: 'left' }
    ];

    if (isLcl) {
      const dimText = [item?.length, item?.width, item?.height].filter(Boolean).join(' × ');
      row.push({ text: dimText, style: 'tableCell', alignment: 'center' });
    }

    row.push(
      { text: item?.packageType || '', style: 'tableCell', alignment: 'left' },
      { text: formatNumber(item?.packageQty, 0), style: 'tableCell', alignment: 'right' },
      { text: formatNumber(item?.grossWeight, 3), style: 'tableCell', alignment: 'right' },
      { text: formatNumber(item?.volume, 3), style: 'tableCell', alignment: 'right' }
    );

    return row;
  });

  const totalNoOfPkg = products.reduce((sum, p) => sum + (Number(p?.packageQty) || 0), 0);
  const totalGrossWeight = products.reduce((sum, p) => sum + (Number(p?.grossWeight) || 0), 0);
  const totalVolume = products.reduce((sum, p) => sum + (Number(p?.volume) || 0), 0);

  const totalRow: any[] = isLcl
    ? [
        { text: '', style: 'tableCell', bold: true },
        { text: 'Total', style: 'tableCell', alignment: 'right', bold: true },
        { text: '', style: 'tableCell', bold: true },
        { text: formatNumber(totalNoOfPkg, 0), style: 'tableCell', alignment: 'right', bold: true },
        { text: formatNumber(totalGrossWeight, 3), style: 'tableCell', alignment: 'right', bold: true },
        { text: formatNumber(totalVolume, 3), style: 'tableCell', alignment: 'right', bold: true }
      ]
    : [
        { text: 'Total', style: 'tableCell', alignment: 'right', bold: true },
        { text: '', style: 'tableCell', bold: true },
        { text: formatNumber(totalNoOfPkg, 0), style: 'tableCell', alignment: 'right', bold: true },
        { text: formatNumber(totalGrossWeight, 3), style: 'tableCell', alignment: 'right', bold: true },
        { text: formatNumber(totalVolume, 3), style: 'tableCell', alignment: 'right', bold: true }
      ];

  const widths = isLcl ? ['*', 120, 70, 70, 70, 70] : ['*', 80, 70, 70, 70];

  return {
    table: {
      headerRows: 1,
      widths,
      body: [headerRow, ...dataRows, totalRow]
    },
    layout: {
      hLineWidth: () => 0.25,
      vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 0 : 0.25),
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 2,
      paddingBottom: () => 2
    },
    margin: [0, 0, 0, 6]
  };
}

function buildRemarksSection(data: PackingListPdfData): any {
  if (!data.packing?.remarks) return { text: '' };
  return {
    columns: [
      { text: 'Remarks', style: 'labelBold', width: 140 },
      { text: ':', width: 6 },
      { text: data.packing.remarks, width: '*' }
    ],
    margin: [0, 6, 0, 10]
  };
}

function buildPackingTermsSection(data: PackingListPdfData): any {
  const terms = (data.terms || []).filter(Boolean);
  if (terms.length === 0) return { text: '' };

  return {
    stack: [
      {
        text: 'Terms and Conditions',
        bold: true,
        fontSize: 12,
        margin: [15, 8, 0, 4]
      },
      {
        ul: terms.map(term => ({
          text: term,
          fontSize: 10,
          margin: [0, 1, 0, 2]
        })),
        margin: [28, 0, 15, 0]
      }
    ],
    margin: [0, 0, 0, 0]
  };
}

export function transformPackingListApiData(
  housejobData: any,
  masterJobData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    ports?: any[];
    terms?: any[];
    selectedFclLcl?: string;
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  }
): PackingListPdfData {
  const resolvePortName = (portCodeOrName?: string): string => {
    if (!portCodeOrName) return '';
    const normalized = String(portCodeOrName).trim().toUpperCase();
    const ports = options?.ports || [];
    const matched = ports.find((p: any) => {
      const code = String(p?.PortCode || p?.portCode || '').trim().toUpperCase();
      return code === normalized;
    });
    if (matched?.PortCode && matched?.PortName) {
      return `${matched.PortCode} - ${matched.PortName}`;
    }
    if (matched?.portCode && matched?.portName) {
      return `${matched.portCode} - ${matched.portName}`;
    }
    return String(portCodeOrName);
  };

  const products = (housejobData?.Products || []).map((item: any) => ({
    productName: item?.ProductName || '',
    length: item?.Length || '',
    width: item?.Width || '',
    height: item?.Height || '',
    packageType: item?.ExternaPkg || '',
    packageQty: item?.ExternlQty || 0,
    grossWeight: item?.GrossWeight || 0,
    volume: item?.Volume || 0
  }));

  const vesselVoyage = [housejobData?.VesselName, housejobData?.VoyageNo].filter(Boolean).join(' / ');

  return {
    company: {
      companyName: company?.companyName || company?.CompanyName || '',
      addressLine1: company?.addressLine1 || company?.Address || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || company?.city || '',
      postalCode: company?.postalCode || company?.postal_code || company?.PostalCode || company?.ZipCode || '',
      phoneNumber: company?.phoneNumber || company?.PhoneNumber || company?.Phone || '',
      countryMaster: company?.countryMaster,
      countryCode: company?.countryMaster?.countryCode || company?.countryCode || ''
    },
    branch: {
      branchName: branch?.branchName || branch?.BranchName || '',
      addressLine1: branch?.addressLine1 || branch?.Address || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || branch?.cityName || '',
      postalCode: branch?.postalCode || branch?.PostalCode || branch?.ZipCode || branch?.postal_code || '',
      phoneNumber: branch?.phoneNumber || branch?.PhoneNumber || branch?.Phone || '',
      cityMaster: branch?.cityMaster,
      countryMaster: branch?.countryMaster,
      countryCode: branch?.countryMaster?.countryCode || branch?.countryCode || ''
    },
    userData: {
      userName: userData?.userName || userData?.UserName || '',
      email: userData?.email || userData?.Email || ''
    },
    logo,
    printSettings: options?.printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
    selectedFclLcl: options?.selectedFclLcl || 'LCL',
    terms: (options?.terms || []).map((t: any) => t?.TandC || t?.Terms || t?.content || t || ''),
    packing: {
      shipperName: housejobData?.ShipperName || '',
      shipperAddress: housejobData?.ShipperAddress || '',
      clientName: housejobData?.CustomerName || '',
      clientAddress: housejobData?.CustomerAddress || '',
      consigneeName: housejobData?.ConsigneeName || '',
      consigneeAddress: housejobData?.ConsigneeAddress || '',
      shipmentNo: housejobData?.ShipmentNo || '',
      jobNo: housejobData?.masterJob?.MasterJobNumber || '',
      mblNo: housejobData?.masterJob?.MBLNo || housejobData?.MBLNo || masterJobData?.MBLNo || '',
      hblNo: housejobData?.HBLNo || '',
      placeOfReceipt: resolvePortName(housejobData?.POO),
      portOfLoading: resolvePortName(housejobData?.POL),
      portOfDischarge: resolvePortName(housejobData?.POD),
      placeOfDelivery: resolvePortName(housejobData?.FPD),
      finalDestination: resolvePortName(housejobData?.FPD),
      eta: housejobData?.ETA,
      etd: housejobData?.ETD,
      vesselVoyage,
      carrier: housejobData?.CarrierName || '',
      movementType: housejobData?.Cargo?.[0]?.MovementType || '',
      freightTerms: housejobData?.FreightTerms || '',
      remarks: housejobData?.InternalNote || ''
    },
    products
  };
}
