/**
 * Commercial Invoice PDF Generator
 * Generates Commercial Invoice PDF based on house job data
 */

import { CommercialInvoicePdfData } from '../interfaces/pdf-document.interfaces';
import { buildHeader } from '../builders/pdf-header.builder';
import { buildDivider } from '../builders/pdf-section.builder';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG } from '../styles/pdf-styles';
import { formatNumber } from '../helpers/pdf-formatters';

export function generateCommercialInvoiceDocument(data: CommercialInvoicePdfData): any {
  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || 'landscape',
    pageMargins: data.config?.pageMargins || [20, 20, 20, 60],
    background: function (currentPage, pageSize) {
      return {
        canvas: [
          { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.8 },
          { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.8 },
          { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.8 },
          { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.8 }
        ]
      };
    },
    content: [
      buildHeader(data.company, data.branch, data.logo, {
        logoWidth: 70,
        logoHeight: 70,
        compact: true
      }),
      buildDivider({ width: 770, margin: [0, 4, 0, 6], thickness: 1 }),
      {
        text: 'Commercial Invoice',
        alignment: 'center',
        bold: true,
        fontSize: 16,
        margin: [0, 0, 0, 8]
      },
      buildHeaderBlocks(data),
      buildPartyBlocks(data),
      buildCargoSummary(data),
      buildCargoTotals(data),
      buildCargoTable(data)
    ],
    footer: createFooterFunction(data.userData),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function buildHeaderBlocks(data: CommercialInvoicePdfData): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        buildKeyRow('HBL No.', data.invoice?.hblNo || ''),
        buildKeyRow('Job No.', data.invoice?.jobNo || '')
      ]]
    },
    layout: 'bordered',
    margin: [0, 0, 0, 0]
  };
}

function buildPartyBlocks(data: CommercialInvoicePdfData): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [
        [
          buildPartyBox('To', data.invoice?.toName, data.invoice?.toAddress),
          buildPartyBox('Shipper', data.invoice?.shipperName, data.invoice?.shipperAddress)
        ],
        [
          buildPartyBox('Consignee', data.invoice?.consigneeName, data.invoice?.consigneeAddress),
          buildPartyBox('Notify', data.invoice?.notifyName, data.invoice?.notifyAddress)
        ]
      ]
    },
    layout: 'bordered',
    margin: [0, 0, 0, 0]
  };
}

function buildPartyBox(title: string, line1?: string, line2?: string): any {
  const stack: any[] = [
    { text: title, style: 'labelBold', margin: [0, 0, 0, 4] }
  ];
  if (line1) stack.push({ text: line1 });
  if (line2) stack.push({ text: line2 });

  return {
    stack,
    margin: [8, 6, 8, 6]
  };
}

function buildKeyRow(label: string, value: string): any {
  return {
    columns: [
      { text: label, style: 'labelBold', width: 120 },
      { text: ':', width: 6 },
      { text: value || '', width: '*' }
    ],
    margin: [6, 4, 6, 4]
  };
}

function buildCargoSummary(data: CommercialInvoicePdfData): any {
  return {
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [[
        buildSummaryCell('Commodity Description', data.invoice?.commodityDescription || ''),
        buildSummaryCell('Currency', data.invoice?.currency || ''),
        buildSummaryCell('No. of Package', formatNumber(data.invoice?.noOfPackage, 0)),
        buildSummaryCell('Gross Weight', formatNumber(data.invoice?.grossWeight, 3))
      ]]
    },
    layout: 'bordered',
    margin: [0, 0, 0, 0]
  };
}

function buildCargoTotals(data: CommercialInvoicePdfData): any {
  return {
    table: {
      widths: ['25%', '25%', '25%', '25%'],
      body: [[
        buildSummaryCell('Net Weight', formatNumber(data.invoice?.netWeight, 3)),
        buildSummaryCell('Volume', formatNumber(data.invoice?.volume, 3)),
        buildSummaryCell('Good Value', formatNumber(data.invoice?.goodsValue, 2)),
        buildSummaryCell('Total Value', data.invoice?.totalValue || '')
      ]]
    },
    layout: 'bordered',
    margin: [0, 0, 0, 6]
  };
}

function buildSummaryCell(label: string, value: string): any {
  return {
    stack: [
      { text: label, style: 'labelBold', alignment: 'center', margin: [0, 0, 0, 3] },
      { text: value || '', alignment: 'right' }
    ],
    margin: [4, 4, 4, 4]
  };
}

function buildCargoTable(data: CommercialInvoicePdfData): any {
  const rows = data.products || [];

  const headerRow = [
    { text: 'Commodity', style: 'tableHeader', alignment: 'center' },
    { text: 'Container No', style: 'tableHeader', alignment: 'center' },
    { text: 'Type', style: 'tableHeader', alignment: 'center' },
    { text: 'No. of Pkgs', style: 'tableHeader', alignment: 'center' },
    { text: 'Gross Wt.', style: 'tableHeader', alignment: 'center' },
    { text: 'Net Wt.', style: 'tableHeader', alignment: 'center' },
    { text: 'Volume', style: 'tableHeader', alignment: 'center' }
  ];

  const dataRows = rows.map(item => ([
    { text: item?.commodity || '', style: 'tableCell' },
    { text: item?.containerNo || '', style: 'tableCell' },
    { text: item?.containerType || '', style: 'tableCell' },
    { text: formatNumber(item?.packageQty, 0), style: 'tableCell', alignment: 'right' },
    { text: formatNumber(item?.grossWeight, 3), style: 'tableCell', alignment: 'right' },
    { text: formatNumber(item?.netWeight, 3), style: 'tableCell', alignment: 'right' },
    { text: formatNumber(item?.volume, 3), style: 'tableCell', alignment: 'right' }
  ]));

  const totals = data.totals || { totalPkg: 0, totalGrossWeight: 0, totalNetWeight: 0, totalVolume: 0 };
  const totalRow = [
    { text: 'Total', colSpan: 3, style: 'tableCell', alignment: 'right' },
    {}, {},
    { text: formatNumber(totals.totalPkg, 0), style: 'tableCell', alignment: 'right' },
    { text: formatNumber(totals.totalGrossWeight, 3), style: 'tableCell', alignment: 'right' },
    { text: formatNumber(totals.totalNetWeight, 3), style: 'tableCell', alignment: 'right' },
    { text: formatNumber(totals.totalVolume, 3), style: 'tableCell', alignment: 'right' }
  ];

  return {
    table: {
      headerRows: 1,
      widths: ['*', 90, 90, 70, 70, 70, 70],
      body: [headerRow, ...dataRows, totalRow]
    },
    layout: 'bordered',
    margin: [0, 6, 0, 0]
  };
}

export function transformCommercialInvoiceApiData(
  housejobData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    containerTypes?: any[];
  }
): CommercialInvoicePdfData {
  const resolveContainerType = (containerTypeSid: number | string | undefined): string => {
    if (!containerTypeSid || !options?.containerTypes?.length) return '';
    const match = options.containerTypes.find((c: any) => c.ContainerTypeMasterSid === containerTypeSid);
    return match?.ContainerName || '';
  };

  const products = (housejobData?.Products || []).map((item: any) => ({
    commodity: item?.ProductName || '',
    containerNo: item?.ContainerNo || '',
    containerType: resolveContainerType(item?.masterJobContainer?.ContainerType),
    packageQty: item?.ExternlQty || 0,
    grossWeight: item?.GrossWeight || 0,
    netWeight: item?.NetWeight || 0,
    volume: item?.Volume || 0
  }));

  const totalPkg = products.reduce((sum, p) => sum + (Number(p.packageQty) || 0), 0);
  const totalGrossWeight = products.reduce((sum, p) => sum + (Number(p.grossWeight) || 0), 0);
  const totalNetWeight = products.reduce((sum, p) => sum + (Number(p.netWeight) || 0), 0);
  const totalVolume = products.reduce((sum, p) => sum + (Number(p.volume) || 0), 0);

  return {
    company: {
      companyName: company?.companyName || company?.CompanyName || '',
      addressLine1: company?.addressLine1 || company?.Address || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || company?.city || '',
      postalCode: company?.postal_code || company?.ZipCode || '',
      phoneNumber: company?.phoneNumber || company?.Phone || ''
    },
    branch: {
      branchName: branch?.branchName || branch?.BranchName || '',
      addressLine1: branch?.addressLine1 || branch?.Address || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || branch?.cityName || '',
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster
    },
    userData: {
      userName: userData?.userName || userData?.UserName || '',
      email: userData?.email || userData?.Email || ''
    },
    logo,
    invoice: {
      hblNo: housejobData?.HBLNo || '',
      jobNo: housejobData?.masterJob?.MasterJobNumber || '',
      toName: housejobData?.ConsigneeName || '',
      toAddress: housejobData?.ConsigneeAddress || '',
      shipperName: housejobData?.ShipperName || '',
      shipperAddress: housejobData?.ShipperAddress || '',
      consigneeName: housejobData?.ConsigneeName || '',
      consigneeAddress: housejobData?.ConsigneeAddress || '',
      notifyName: housejobData?.Notify || '',
      notifyAddress: housejobData?.NotifyAddress || '',
      commodityDescription: housejobData?.Cargo?.[0]?.CommodityDescription || '',
      currency: housejobData?.Others?.[0]?.CargoCurrency || '',
      noOfPackage: housejobData?.Cargo?.[0]?.NoOfPackage || 0,
      grossWeight: housejobData?.Cargo?.[0]?.GrossWeight || 0,
      netWeight: housejobData?.Cargo?.[0]?.NetWeight || 0,
      volume: housejobData?.Cargo?.[0]?.Volume || 0,
      goodsValue: housejobData?.Others?.[0]?.CargoValue || 0,
      totalValue: ''
    },
    products,
    totals: { totalPkg, totalGrossWeight, totalNetWeight, totalVolume }
  };
}
