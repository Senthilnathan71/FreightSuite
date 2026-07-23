import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { buildCompanyHeader } from '../builders/pdf-header.builder';
import { getPdfStyles } from '../styles/pdf-styles';

interface LoadingPlanEntryRow {
  blNo: string;
  origin: string;
  destination: string;
  shipper: string;
  consignee: string;
  commodityDescription: string;
  cargoType: string;
  noOfPackage: number;
  grossWeight: number;
  netWeight: number;
  volume: number;
}

interface LoadingPlanEntryInfo {
  vesselVoyageNo: string;
  carrier: string;
  freightTerms: string;
  etd: string;
  eta: string;
  por: string;
  pol: string;
  pod: string;
  fdc: string;
}

interface LoadingPlanEntryTotals {
  noOfPackage: number;
  grossWeight: number;
  netWeight: number;
  volume: number;
}

type HeaderPosition = 'left' | 'center' | 'right';

export interface LoadingPlanEntryPdfData {
  reportTitle: string;
  company: any;
  branch: any;
  userData: any;
  logo?: string;
  printSettings?: {
    logoPosition: HeaderPosition;
    companyPosition: HeaderPosition;
    companyAlignment: HeaderPosition;
  };
  info: LoadingPlanEntryInfo;
  rows: LoadingPlanEntryRow[];
  totals: LoadingPlanEntryTotals;
  config?: {
    pageSize?: 'A4' | 'LETTER';
    pageOrientation?: 'portrait' | 'landscape';
    pageMargins?: [number, number, number, number];
  };
}

function toNumber(value: any): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function generateLoadingPlanEntryDocument(data: LoadingPlanEntryPdfData): any {
  return {
    pageSize: data.config?.pageSize || 'A4',
    pageOrientation: data.config?.pageOrientation || 'landscape',
    pageMargins: data.config?.pageMargins || [15, 98, 15, 46],
    header: () => ({
      stack: [buildHeader(data)],
      margin: [15, 10, 15, 4]
    }),
    background: (_: number, pageSize: any) => ({
      canvas: [{
        type: 'rect',
        x: 14,
        y: 14,
        w: pageSize.width - 28,
        h: pageSize.height - 28,
        lineWidth: 1,
        lineColor: '#000'
      }]
    }),
    content: [
      buildTitle(data),
      buildInfoSection(data.info),
      buildLoadingPlanTable(data.rows, data.totals)
    ],
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    styles: getLoadingPlanEntryStyles(),
    defaultStyle: {
      fontSize: 10,
      color: '#000'
    }
  };
}

function buildHeader(data: LoadingPlanEntryPdfData): any {
  return {
    stack: [
      buildCompanyHeader(data),
      { canvas: [{ type: 'line', x1: -1, y1: 0, x2: 813, y2: 0, lineWidth: 0.8, lineColor: '#000' }] }
    ],
    margin: [0, 0, 0, 2]
  };
}

function buildTitle(data: LoadingPlanEntryPdfData): any {
  return {
    text: data.reportTitle,
    bold: true,
    alignment: 'center',
    fontSize: 12,
    margin: [0, 4, 0, 10]
  };
}

function buildInfoSection(info: LoadingPlanEntryInfo): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        {
          stack: [
            buildKeyValueRow('Vessel / Voy No.', info.vesselVoyageNo, 90),
            buildKeyValueRow('Carrier', info.carrier, 90),
            buildKeyValueRow('PP/CC', info.freightTerms, 90),
            buildKeyValueRow('ETD', info.etd, 90),
            buildKeyValueRow('ETA', info.eta, 90)
          ],
          border: [false, false, false, false]
        },
        {
          stack: [
            buildKeyValueRow('POR', info.por, 60),
            buildKeyValueRow('POL', info.pol, 60),
            buildKeyValueRow('POD', info.pod, 60),
            buildKeyValueRow('FDC', info.fdc, 60)
          ],
          border: [false, false, false, false]
        }
      ]]
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingTop: () => 2,
      paddingBottom: () => 2,
      paddingLeft: () => 12,
      paddingRight: () => 12
    },
    margin: [0, 0, 0, 8]
  };
}

function buildKeyValueRow(label: string, value?: string, labelWidth = 78): any {
  return {
    columns: [
      { text: label, width: labelWidth, style: 'sectionLabel' },
      { text: ':', width: 8, style: 'valueText' },
      { text: value || '', width: '*', style: 'valueText' }
    ],
    margin: [0, 0, 0, 4]
  };
}

function buildLoadingPlanTable(rows: LoadingPlanEntryRow[], totals: LoadingPlanEntryTotals): any {
  const body = rows.map((row) => ([
    buildTextCell(row.blNo, 'left', [false, false, true, true]),
    buildTextCell(row.origin),
    buildTextCell(row.destination),
    buildTextCell(row.shipper),
    buildTextCell(row.consignee),
    buildTextCell(row.commodityDescription),
    buildTextCell(row.cargoType),
    buildNumberCell(row.noOfPackage, 0),
    buildNumberCell(row.grossWeight, 3),
    buildNumberCell(row.netWeight, 3),
    buildNumberCell(row.volume, 3, [true, false, false, true])
  ]));

  if (!body.length) {
    body.push([
      {
        text: 'No loading plan data available',
        colSpan: 11,
        alignment: 'center',
        style: 'tableCell'
      },
      {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
    ]);
  }

  body.push([
    {
      text: 'TOTAL',
      colSpan: 7,
      alignment: 'right',
      style: 'tableHeader',
      border: [false, true, true, true]
    },
    {}, {}, {}, {}, {}, {},
    buildNumberCell(totals.noOfPackage, 0),
    buildNumberCell(totals.grossWeight, 3),
    buildNumberCell(totals.netWeight, 3),
    buildNumberCell(totals.volume, 3, [true, true, false, true])
  ]);

  return {
    table: {
      headerRows: 1,
      widths: [65, 45, 45, '*', '*', 85, 55, 48, 52, 52, 52],
      body: [
        [
          buildHeaderCell('BL No.', [false, true, true, true]),
          buildHeaderCell('Origin'),
          buildHeaderCell('Dest.'),
          buildHeaderCell('Shipper & Address'),
          buildHeaderCell('Consignee & Address'),
          buildHeaderCell('Commodity Desc.'),
          buildHeaderCell('Cargo Type'),
          buildHeaderCell('No.of Pkg'),
          buildHeaderCell('G.Wt.'),
          buildHeaderCell('Nt Wt.'),
          buildHeaderCell('Vol.', [true, true, false, true])
        ],
        ...body
      ]
    },
    layout: {
      hLineWidth: () => 0.8,
      vLineWidth: () => 0.8,
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingTop: () => 3,
      paddingBottom: () => 3,
      paddingLeft: () => 4,
      paddingRight: () => 4
    },
    margin: [0, 0, 0, 8]
  };
}

function buildHeaderCell(text: string, border: [boolean, boolean, boolean, boolean] = [true, true, true, true]): any {
  return {
    text,
    style: 'tableHeader',
    alignment: 'center',
    border
  };
}

function buildTextCell(
  value?: string,
  alignment: 'left' | 'center' | 'right' = 'left',
  border: [boolean, boolean, boolean, boolean] = [true, true, true, true]
): any {
  return {
    text: value || '',
    style: 'tableCell',
    alignment,
    border
  };
}

function buildNumberCell(
  value?: number,
  decimals = 3,
  border: [boolean, boolean, boolean, boolean] = [true, true, true, true]
): any {
  return {
    text: formatNumberWithCommas(value || 0, decimals),
    style: 'tableCell',
    alignment: 'right',
    border
  };
}

function getLoadingPlanEntryStyles(): any {
  return {
    ...getPdfStyles(),
    sectionLabel: { fontSize: 9, bold: true },
    valueText: { fontSize: 9 },
    tableHeader: { fontSize: 9, bold: true, alignment: 'center' },
    tableCell: { fontSize: 9 }
  };
}

function buildFooter(data: LoadingPlanEntryPdfData, currentPage: number, pageCount: number): any {
  return {
    margin: [24, 0, 24, 12],
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, alignment: 'left', width: '30%', fontSize: 9, noWrap: true },
      { text: 'This document is computer-generated and does not require a signature.', alignment: 'center', width: '*', fontSize: 9, noWrap: true },
      { text: `Printed On : ${formatDate(new Date())}  Page ${currentPage} of ${pageCount}`, alignment: 'right', width: '30%', fontSize: 9, noWrap: true }
    ]
  };
}

export function transformLoadingPlanEntryApiData(
  loadingPlanData: any[],
  selectedBookings: any[],
  totals: { totalPkg?: any; totalGrossWeight?: any; totalNetWeight?: any; totalVolume?: any; },
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    portList?: any[];
    carrier?: string;
    printSettings?: {
      logoPosition: HeaderPosition;
      companyPosition: HeaderPosition;
      companyAlignment: HeaderPosition;
    };
  }
): LoadingPlanEntryPdfData {
  const firstRow = loadingPlanData?.[0] || {};
  const portList = options?.portList || [];

  const toDisplayDate = (value: any): string => {
    if (!value) return '';
    if (value instanceof Date) return formatDate(value);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(trimmed)) {
        return trimmed;
      }
    }
    return formatDate(value);
  };

  const getPortName = (portCode: string): string => {
    if (!portCode) {
      return '';
    }

    const port = portList.find((item: any) => item?.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  };

  const rows: LoadingPlanEntryRow[] = (selectedBookings || []).map((item: any) => ({
    blNo: item?.BookingNo || '',
    origin: item?.POO || '',
    destination: item?.AgentName || '',
    shipper: joinNonEmpty([item?.ShipperName, item?.ShipperAddress], ' & '),
    consignee: joinNonEmpty([item?.ConsigneeName, item?.ConsigneeAddress], ' & '),
    commodityDescription: item?.CommodityDescription || '',
    cargoType: item?.CargoType || '',
    noOfPackage: toNumber(item?.NoOfPackage),
    grossWeight: toNumber(item?.GrossWeight),
    netWeight: toNumber(item?.NetWeight),
    volume: toNumber(item?.Volume)
  }));

  return {
    reportTitle: 'Container Load Plan',
    company: {
      companyName: company?.CompanyName || company?.companyName || '',
      addressLine1: company?.Address || company?.addressLine1 || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || company?.city || '',
      postalCode: company?.ZipCode || company?.postalCode || '',
      phoneNumber: company?.Phone || company?.phoneNumber || '',
      email: company?.Email || company?.email || '',
      countryMaster: company?.countryMaster,
      countryCode: company?.countryMaster?.countryCode || company?.countryCode || ''
    },
    branch: {
      branchName: branch?.BranchName || branch?.branchName || '',
      addressLine1: branch?.Address || branch?.addressLine1 || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || branch?.cityName || '',
      postalCode: branch?.postalCode || branch?.ZipCode || '',
      phoneNumber: branch?.phoneNumber || branch?.Phone || '',
      cityMaster: branch?.cityMaster,
      countryMaster: branch?.countryMaster,
      countryCode: branch?.countryMaster?.countryCode || branch?.countryCode || ''
    },
    userData: {
      userName: userData?.UserName || userData?.userName || '',
      email: userData?.Email || userData?.email || ''
    },
    logo,
    printSettings: options?.printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
    info: {
      vesselVoyageNo: joinNonEmpty([firstRow?.VesselName, firstRow?.VoyageNo], ' / '),
      carrier: options?.carrier || firstRow?.CarrierName || '',
      freightTerms: firstRow?.FreightTerms || '',
      etd: toDisplayDate(firstRow?.ETDDate || firstRow?.ETD),
      eta: toDisplayDate(firstRow?.ETADate || firstRow?.ETA),
      por: getPortName(firstRow?.POO),
      pol: getPortName(firstRow?.POL),
      pod: getPortName(firstRow?.POD),
      fdc: getPortName(firstRow?.FPD)
    },
    rows,
    totals: {
      noOfPackage: toNumber(totals?.totalPkg),
      grossWeight: toNumber(totals?.totalGrossWeight),
      netWeight: toNumber(totals?.totalNetWeight),
      volume: toNumber(totals?.totalVolume)
    },
    config: {
      pageOrientation: 'landscape'
    }
  };
}
