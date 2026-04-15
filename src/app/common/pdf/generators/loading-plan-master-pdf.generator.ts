import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { getPdfStyles } from '../styles/pdf-styles';

interface LoadingPlanMasterRow {
  blNo: string;
  origin: string;
  destination: string;
  shipper: string;
  consignee: string;
  commodityDescription: string;
  marksAndNumber: string;
  noOfPackage: number;
  grossWeight: number;
  netWeight: number;
  volume: number;
}

interface LoadingPlanMasterInfo {
  mblNo: string;
  vesselVoyageNo: string;
  carrier: string;
  freightTerms: string;
  jobNo: string;
  jobDate: string;
  etd: string;
  eta: string;
  por: string;
  pol: string;
  pod: string;
  fdc: string;
}

export interface LoadingPlanMasterPdfData {
  reportTitle: string;
  company: any;
  branch: any;
  userData: any;
  logo?: string;
  info: LoadingPlanMasterInfo;
  rows: LoadingPlanMasterRow[];
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

export function generateLoadingPlanMasterDocument(data: LoadingPlanMasterPdfData): any {
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
      buildLoadingPlanTable(data.rows)
    ],
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    styles: getLoadingPlanMasterStyles(),
    defaultStyle: {
      fontSize: 10,
      color: '#000'
    }
  };
}

function buildHeader(data: LoadingPlanMasterPdfData): any {
  const company: any = data.company || {};
  const branch: any = data.branch || {};
  const logoPosition = 'left' as 'left' | 'center' | 'right';
  const companyPosition = 'center' as 'left' | 'center' | 'right';
  const companyAlignment = 'center' as 'left' | 'center' | 'right';
  const detailLine1 = branch?.addressLine1 || company?.addressLine1 || '';
  const detailLine2 = [
    branch?.addressLine2 || company?.addressLine2 || '',
    branch?.cityName || branch?.cityMaster?.cityName || company?.city || '',
    (branch?.postalCode || company?.postalCode) ? `Postal Code : ${branch?.postalCode || company?.postalCode}` : '',
    (branch?.phoneNumber || company?.phoneNumber) ? `Ph.no : ${branch?.phoneNumber || company?.phoneNumber}` : ''
  ].filter(Boolean).join(', ');

  const companyDetails = {
    stack: [
      { text: (company?.companyName || '').toUpperCase(), bold: true, fontSize: 14, alignment: companyAlignment },
      { text: branch?.branchName || '', bold: true, fontSize: 11, alignment: companyAlignment, margin: [0, 1, 0, 0] },
      { text: detailLine1, fontSize: 9, alignment: companyAlignment, margin: [0, 1, 0, 0] },
      { text: detailLine2, fontSize: 9, alignment: companyAlignment, margin: [0, 1, 0, 0] }
    ]
  };

  return {
    stack: [
      {
        columns: [
          {
            width: '*',
            stack: [
              logoPosition === 'left' ? buildHeaderLogo(data.logo, 'left') : { text: '' },
              companyPosition === 'left' ? companyDetails : { text: '' }
            ]
          },
          {
            width: '*',
            stack: [
              logoPosition === 'center' ? buildHeaderLogo(data.logo, 'center') : { text: '' },
              companyPosition === 'center' ? companyDetails : { text: '' }
            ]
          },
          {
            width: '*',
            stack: [
              logoPosition === 'right' ? buildHeaderLogo(data.logo, 'right') : { text: '' },
              companyPosition === 'right' ? companyDetails : { text: '' }
            ]
          }
        ]
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 812,
            y2: 0,
            lineWidth: 1,
            lineColor: '#000'
          }
        ],
        margin: [0, 6, 0, 0]
      }
    ],
    margin: [0, 0, 0, 2]
  };
}

function buildHeaderLogo(logo: string | undefined, alignment: 'left' | 'center' | 'right'): any {
  if (!logo) {
    return { text: '' };
  }

  return {
    image: logo,
    fit: [50, 50],
    alignment,
    margin: [4, 6, 0, 0]
  };
}

function buildTitle(data: LoadingPlanMasterPdfData): any {
  return {
    text: data.reportTitle,
    bold: true,
    alignment: 'center',
    fontSize: 12,
    margin: [0, 4, 0, 10]
  };
}

function buildInfoSection(info: LoadingPlanMasterInfo): any {
  return {
    table: {
      widths: ['34%', '32%', '34%'],
      body: [[
        {
          stack: [
            buildKeyValueRow('MBL No.', info.mblNo, 78),
            buildKeyValueRow('Vessel / Voy No.', info.vesselVoyageNo, 78),
            buildKeyValueRow('Carrier', info.carrier, 78),
            buildKeyValueRow('PP/CC', info.freightTerms, 78)
          ],
          border: [false, false, false, false]
        },
        {
          stack: [
            buildKeyValueRow('Job No.', info.jobNo, 58),
            buildKeyValueRow('Job Date', info.jobDate, 58),
            buildKeyValueRow('ETD', info.etd, 58),
            buildKeyValueRow('ETA', info.eta, 58)
          ],
          border: [false, false, false, false]
        },
        {
          stack: [
            buildKeyValueRow('POR', info.por, 40),
            buildKeyValueRow('POL', info.pol, 40),
            buildKeyValueRow('POD', info.pod, 40),
            buildKeyValueRow('FDC', info.fdc, 40)
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
      paddingLeft: () => 14,
      paddingRight: () => 14
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

function buildLoadingPlanTable(rows: LoadingPlanMasterRow[]): any {
  const body = rows.map((row) => ([
    buildTextCell(row.blNo, 'left', [false, false, true, true], true),
    buildTextCell(row.origin),
    buildTextCell(row.destination),
    buildTextCell(row.shipper),
    buildTextCell(row.consignee),
    buildTextCell(row.commodityDescription),
    buildTextCell(row.marksAndNumber),
    buildNumberCell(row.noOfPackage, 0),
    buildNumberCell(row.grossWeight, 3),
    buildNumberCell(row.netWeight, 3),
    buildNumberCell(row.volume, 3, [true, false, false, true])
  ]));

  const totals = rows.reduce(
    (acc, row) => ({
      grossWeight: acc.grossWeight + toNumber(row.grossWeight),
      netWeight: acc.netWeight + toNumber(row.netWeight),
      volume: acc.volume + toNumber(row.volume)
    }),
    { grossWeight: 0, netWeight: 0, volume: 0 }
  );

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
  } else {
    body.push([
      {
        text: 'TOTAL',
        colSpan: 8,
        style: 'tableCell',
        bold: true,
        alignment: 'right',
        border: [false, true, true, true]
      },
      { text: '', border: [true, true, true, true] },
      { text: '', border: [true, true, true, true] },
      { text: '', border: [true, true, true, true] },
      { text: '', border: [true, true, true, true] },
      { text: '', border: [true, true, true, true] },
      { text: '', border: [true, true, true, true] },
      { text: '', border: [true, true, true, true] },
      buildNumberCell(totals.grossWeight, 3, [true, true, true, true], true),
      buildNumberCell(totals.netWeight, 3, [true, true, true, true], true),
      buildNumberCell(totals.volume, 3, [true, true, false, true], true)
    ]);
  }

  return {
    table: {
      headerRows: 1,
      widths: [65, 45, 45, '*', '*', 85, 65, 48, 52, 52, 52],
      body: [
        [
          buildHeaderCell('HBL No.', [false, true, true, true]),
          buildHeaderCell('Origin'),
          buildHeaderCell('Dest.'),
          buildHeaderCell('Shipper & Address'),
          buildHeaderCell('Consignee & Address'),
          buildHeaderCell('Commodity Desc'),
          buildHeaderCell('Marks & No.'),
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
  border: [boolean, boolean, boolean, boolean] = [true, true, true, true],
  bold = false
): any {
  return {
    text: value || '',
    style: 'tableCell',
    alignment,
    border,
    bold
  };
}

function buildNumberCell(
  value?: number,
  decimals = 3,
  border: [boolean, boolean, boolean, boolean] = [true, true, true, true],
  bold = false
): any {
  return {
    text: formatNumberWithCommas(value || 0, decimals),
    style: 'tableCell',
    alignment: 'right',
    border,
    bold
  };
}

function getLoadingPlanMasterStyles(): any {
  return {
    ...getPdfStyles(),
    sectionLabel: { fontSize: 8, bold: true },
    valueText: { fontSize: 8 },
    tableHeader: { fontSize: 8, bold: true, alignment: 'center' },
    tableCell: { fontSize: 8 }
  };
}

function buildFooter(data: LoadingPlanMasterPdfData, currentPage: number, pageCount: number): any {
  return {
    margin: [24, 0, 24, 12],
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, alignment: 'left', width: '30%', fontSize: 9, noWrap: true },
      { text: '', alignment: 'center', width: '*', fontSize: 9, noWrap: true },
      { text: `Printed On : ${formatDate(new Date())}  Page ${currentPage} of ${pageCount}`, alignment: 'right', width: '30%', fontSize: 9, noWrap: true }
    ]
  };
}

export function transformLoadingPlanMasterApiData(
  masterJobData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    portList?: any[];
  }
): LoadingPlanMasterPdfData {
  const voyages = masterJobData?.voyages?.[0] || {};
  const firstHouseJob = masterJobData?.houseJob?.[0] || {};
  const allShipments = masterJobData?.allShipments || [];
  const portList = options?.portList || [];

  const getPortName = (portCode: string): string => {
    if (!portCode) {
      return '';
    }

    const port = portList.find((item: any) => item?.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  };

  const rows: LoadingPlanMasterRow[] = (masterJobData?.houseJob || []).map((item: any) => {
    const shipment = allShipments.find(
      (row: any) => String(row?.HouseJobSid) === String(item?.HouseJobSid)
    ) || {};
    const cargo = item?.Cargo?.[0] || {};

    return {
      blNo: item?.HBLNo || shipment?.HBLNo || '',
      origin: shipment?.POO || item?.POO || '',
      destination: shipment?.FPD || item?.FPD || '',
      shipper: joinNonEmpty([item?.ShipperName, item?.ShipperAddress], ' & '),
      consignee: joinNonEmpty([item?.ConsigneeName, item?.ConsigneeAddress], ' & '),
      commodityDescription: cargo?.CommodityDescription || '',
      marksAndNumber: cargo?.MarksAndNumber || '',
      noOfPackage: toNumber(cargo?.NoOfPackage),
      grossWeight: toNumber(cargo?.GrossWeight),
      netWeight: toNumber(cargo?.NetWeight),
      volume: toNumber(cargo?.Volume)
    };
  });

  return {
    reportTitle: 'Container Load Plan',
    company: {
      companyName: company?.CompanyName || company?.companyName || '',
      addressLine1: company?.Address || company?.addressLine1 || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || company?.city || '',
      postalCode: company?.ZipCode || company?.postalCode || '',
      phoneNumber: company?.Phone || company?.phoneNumber || '',
      email: company?.Email || company?.email || ''
    },
    branch: {
      branchName: branch?.BranchName || branch?.branchName || '',
      addressLine1: branch?.Address || branch?.addressLine1 || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || branch?.cityName || '',
      postalCode: branch?.postalCode || branch?.ZipCode || '',
      phoneNumber: branch?.phoneNumber || branch?.Phone || '',
      cityMaster: branch?.cityMaster
    },
    userData: {
      userName: userData?.UserName || userData?.userName || '',
      email: userData?.Email || userData?.email || ''
    },
    logo,
    info: {
      mblNo: masterJobData?.MBLNo || '',
      vesselVoyageNo: joinNonEmpty([voyages?.VesselName, voyages?.VoyageNo], ' / '),
      carrier: voyages?.CarrierName || '',
      freightTerms: firstHouseJob?.FreightTerms || '',
      jobNo: masterJobData?.MasterJobNumber || '',
      jobDate: formatDate(masterJobData?.MasterJobDate),
      etd: formatDate(voyages?.ETD),
      eta: formatDate(voyages?.ETA),
      por: getPortName(masterJobData?.POO),
      pol: getPortName(masterJobData?.POL),
      pod: getPortName(masterJobData?.POD),
      fdc: getPortName(masterJobData?.FPD)
    },
    rows,
    config: {
      pageOrientation: 'landscape'
    }
  };
}
