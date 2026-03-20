import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { getPdfStyles } from '../styles/pdf-styles';

interface CfsOutturnRow {
  hblNo: string;
  shipmentNo: string;
  shipperName: string;
  consigneeName: string;
  productName: string;
  shipmentRemarks: string;
  landedMarks: string;
  manifest: number;
  outturn: number;
  weight: number;
  cbm: number;
  surplus: number | string;
  short: number | string;
  damaged: number;
  damagedRemarks: string;
  warehouseLocation: string;
  jobType: string;
}

interface CfsOutturnPage {
  containerNo: string;
  masterJobNo: string;
  vesselVoyage: string;
  agent: string;
  shed: string;
  seal: string;
  remarks: string;
  rows: CfsOutturnRow[];
  totals: {
    manifest: number;
    outturn: number;
    weight: number;
    cbm: number;
    surplus: number;
    short: number;
    damaged: number;
  };
}

export interface CfsOutturnPdfData {
  reportTitle: string;
  company: any;
  branch: any;
  userData: any;
  logo?: string;
  pages: CfsOutturnPage[];
  config?: {
    pageSize?: 'A4' | 'LETTER';
    pageOrientation?: 'portrait' | 'landscape';
    pageMargins?: [number, number, number, number];
  };
}

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function generateCfsOutturnDocument(data: CfsOutturnPdfData): any {
  const content: any[] = [];

  data.pages.forEach((page, index) => {
    const pageContent = [
      buildTitle(data),
      buildContainerInfoSection(page),
      buildOutturnTable(page),
    ];

    if (index > 0) {
      pageContent[0] = { ...pageContent[0], pageBreak: 'before' };
    }

    content.push(...pageContent);
  });

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
    content,
    footer: () => buildFooter(data),
    styles: getCfsOutturnStyles(),
    defaultStyle: {
      fontSize: 10,
      color: '#000'
    }
  };
}

function buildHeader(data: CfsOutturnPdfData): any {
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

function buildTitle(data: CfsOutturnPdfData): any {
  return {
    text: data.reportTitle,
    bold: true,
    alignment: 'center',
    fontSize: 10,
    margin: [0, 4, 0, 10]
  };
}

function buildContainerInfoSection(page: CfsOutturnPage): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        {
          stack: [
            buildKeyValueRow('Container No.', page.containerNo === 'No Container Data' ? '' : page.containerNo, 90),
            buildKeyValueRow('MasterJob No.', page.masterJobNo || '', 90),
            buildKeyValueRow('Vessel/Voyage', page.vesselVoyage || '', 90),
            buildKeyValueRow('Agent', page.agent || '', 90),
          ],
          border: [false, false, false, false]
        },
        {
          stack: [
            buildKeyValueRow('Shed', page.shed || '', 55),
            buildKeyValueRow('Seal', page.seal || '', 55),
            buildKeyValueRow('Remarks', page.remarks || '', 55),
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
      paddingLeft: () => 45,
      paddingRight: () => 10,
    },
    margin: [0, 0, 0, 8]
  };
}

function buildKeyValueRow(label: string, value?: string, labelWidth = 90): any {
  return {
    columns: [
      { text: label, width: labelWidth, style: 'sectionLabel' },
      { text: ':', width: 8 },
      { text: value || '', width: '*', style: 'valueText' }
    ],
    margin: [0, 0, 0, 4]
  };
}
function removeLeftRightBorderLayout() {
  return {
    hLineWidth: function () {
      return 0.5; // keep top & bottom lines
    },
    vLineWidth: function (i, node) {
      // ❌ remove only left & right outer borders
      if (i === 0 || i === node.table.widths.length) {
        return 0;
      }
      // ✅ keep inner vertical lines
      return 0.5;
    },
    hLineColor: () => '#000',
    vLineColor: () => '#000',
  };
}
function buildOutturnTable(page: CfsOutturnPage): any {
  const header = [
    'HBL No./Shipment No.',
    'Shipper / Consignee / Manifested Marks NOS / Shipment Remarks',
    'Landed Marks NOS',
    'Manifest',
    'Outturn',
    'Weight',
    'CBM',
    'Surplus',
    'Short',
    'Damaged',
    'Damaged Remarks',
    'Warehouse Location',
    'Job Type'
  ];

  const rows = page.rows.map((item) => ([
    buildTextCell(joinNonEmpty([item.hblNo, item.shipmentNo], '\n'), false, 'center'),
    {
      stack: [
        { text: [{ text: 'Shipper: ', bold: true }, item.shipperName || ''], style: 'tableCell' },
        { text: [{ text: 'Consignee: ', bold: true }, item.consigneeName || ''], style: 'tableCell' },
        { text: [{ text: 'Product: ', bold: true }, item.productName || ''], style: 'tableCell' },
        { text: [{ text: 'Shipment Remarks: ', bold: true }, item.shipmentRemarks || ''], style: 'tableCell' }
      ]
    },
    buildTextCell(item.landedMarks || '', false, 'center'),
    buildNumberCell(item.manifest, 0, false, 'center'),
    buildNumberCell(item.outturn, 0, false, 'center'),
    buildNumberCell(item.weight, 3),
    buildNumberCell(item.cbm, 3),
    typeof item.surplus === 'number'
      ? buildNumberCell(item.surplus, 0, false, 'center')
      : buildTextCell(String(item.surplus || ''), false, 'center'),
    typeof item.short === 'number'
      ? buildNumberCell(item.short, 0, false, 'center')
      : buildTextCell(String(item.short || ''), false, 'center'),
    buildNumberCell(item.damaged, 0, false, 'center'),
    buildTextCell(item.damagedRemarks || ''),
    buildTextCell(item.warehouseLocation || '', false, 'center'),
    buildTextCell(item.jobType || '', false, 'center')
  ]));

  rows.push([
    { text: 'Total', colSpan: 3, style: 'tableCellBold', alignment: 'right' },
    {},
    {},
    buildNumberCell(page.totals.manifest, 0, true, 'center'),
    buildNumberCell(page.totals.outturn, 0, true, 'center'),
    buildNumberCell(page.totals.weight, 3, true),
    buildNumberCell(page.totals.cbm, 3, true),
    buildNumberCell(page.totals.surplus, 0, true, 'center'),
    buildNumberCell(page.totals.short, 0, true, 'center'),
    buildTextCell('', true, 'center'),
    buildNumberCell(page.totals.damaged, 0, true, 'center'),
    buildTextCell('', true, 'center'),
    buildTextCell('', true, 'center'),
  ]);

  return {
    table: {
      headerRows: 1,
      widths: [60, '*', 52, 38, 38, 42, 42, 38, 38, 42, 60, 50, 45],
      body: [
        header.map((text) => ({ text, style: 'tableHeader' })),
        ...rows
      ]
    },
    layout: removeLeftRightBorderLayout(),
    margin: [0, 0, 0, 8]
  };
}

function buildTextCell(
  value?: string,
  bold = false,
  alignment: 'left' | 'center' | 'right' = 'left'
): any {
  return {
    text: value || '',
    style: bold ? 'tableCellBold' : 'tableCell',
    alignment
  };
}

function buildNumberCell(
  value?: number,
  decimals = 2,
  bold = false,
  alignment: 'left' | 'center' | 'right' = 'right'
): any {
  return {
    text: formatNumberWithCommas(value || 0, decimals),
    style: bold ? 'tableCellBold' : 'tableCell',
    alignment
  };
}

function borderedLayout(): any {
  return {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingTop: () => 3,
    paddingBottom: () => 3,
    paddingLeft: () => 4,
    paddingRight: () => 4
  };
}

function getCfsOutturnStyles(): any {
  return {
    ...getPdfStyles(),
    sectionLabel: { fontSize: 8, bold: true },
    valueText: { fontSize: 8 },
    tableHeader: { fontSize: 8, bold: true, fillColor: '#e9ecef', alignment: 'center' },
    tableCell: { fontSize: 8 },
    tableCellBold: { fontSize: 8, bold: true }
  };
}

function buildFooter(data: CfsOutturnPdfData): any {
  return {
    margin: [24, 0, 24, 12],
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, alignment: 'left', width: '30%', fontSize: 9 },
      { text: 'This document is computer-generated and does not require a signature.', alignment: 'center', width: '40%', fontSize: 9 },
      { text: `Printed On : ${formatDate(new Date())}`, alignment: 'right', width: '30%', fontSize: 9 }
    ]
  };
}

export function transformCfsOutturnApiData(
  masterJobData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    agentList?: any[];
    yardList?: any[];
  }
): CfsOutturnPdfData {
  const houseJob = masterJobData?.houseJob?.[0] || {};
  const cargo = houseJob?.Cargo?.[0] || {};
  const masterOther = masterJobData?.others?.[0] || {};
  const houseOther = houseJob?.Others?.[0] || {};
  const containers = Array.isArray(masterJobData?.containers) ? masterJobData.containers : [];

  const getAgentName = (agentSid?: number): string => {
    if (!agentSid) return '';
    return (options?.agentList || []).find((item: any) => item?.CustomerMasterSid === agentSid)?.CustomerName || '';
  };

  const getYardName = (yardSid?: number): string => {
    if (!yardSid) return '';
    return (options?.yardList || []).find((item: any) => item?.CustomerMasterSid === yardSid)?.CustomerName || '';
  };

  const groupedContainers = new Map<string, any[]>();
  containers.forEach((container: any) => {
    const key = container?.ContainerNumber || 'No Container Data';
    if (!groupedContainers.has(key)) {
      groupedContainers.set(key, []);
    }
    groupedContainers.get(key)!.push(container);
  });

  const containerList = groupedContainers.size
    ? Array.from(groupedContainers.keys())
    : ['No Container Data'];

  const pages: CfsOutturnPage[] = containerList.map((containerNo: string) => {
    const pageProducts = groupedContainers.get(containerNo) || [];

    const rows: CfsOutturnRow[] = pageProducts.length
      ? pageProducts.map((product: any) => {
          const manifest = toNumber(product?.ExternlQty) || toNumber(cargo?.NoOfPackage);
          const outturn = toNumber(product?.ReceivedQty);
          const surplus = Math.max(outturn - manifest, 0);
          const short = Math.max(manifest - outturn, 0);

          return {
            hblNo: houseJob?.HBLNo || '',
            shipmentNo: houseJob?.ShipmentNo || houseJob?.BookingNo || '',
            shipperName: houseJob?.ShipperName || '',
            consigneeName: houseJob?.ConsigneeName || '',
            productName: product?.ProductName || '',
            shipmentRemarks: houseJob?.GeneralNote || '',
            landedMarks: product?.MarksAndNumber || cargo?.MarksAndNumber || '',
            manifest,
            outturn,
            weight: toNumber(product?.GrossWeight) || toNumber(cargo?.GrossWeight),
            cbm: toNumber(product?.Volume) || toNumber(cargo?.Volume),
            surplus,
            short,
            damaged: toNumber(product?.DamageQty),
            damagedRemarks: product?.DamageRemarks || '',
            warehouseLocation: houseOther?.YardCFS || '',
            jobType: houseJob?.JobType || '',
          };
        })
      : [{
          hblNo: houseJob?.HBLNo || '',
          shipmentNo: houseJob?.ShipmentNo || houseJob?.BookingNo || '',
          shipperName: houseJob?.ShipperName || '',
          consigneeName: houseJob?.ConsigneeName || '',
          productName: 'No products available',
          shipmentRemarks: houseJob?.GeneralNote || 'No remarks',
          landedMarks: cargo?.MarksAndNumber || '',
          manifest: toNumber(cargo?.NoOfPackage),
          outturn: 0,
          weight: toNumber(cargo?.GrossWeight),
          cbm: toNumber(cargo?.Volume),
          surplus: '-',
          short: '-',
          damaged: 0,
          damagedRemarks: '',
          warehouseLocation: houseOther?.YardCFS || '',
          jobType: houseJob?.JobType || '',
        }];

    const totals = rows.reduce(
      (acc, row) => {
        acc.manifest += toNumber(row.manifest);
        acc.outturn += toNumber(row.outturn);
        acc.weight += toNumber(row.weight);
        acc.cbm += toNumber(row.cbm);
        acc.surplus += typeof row.surplus === 'number' ? row.surplus : 0;
        acc.short += typeof row.short === 'number' ? row.short : 0;
        acc.damaged += toNumber(row.damaged);
        return acc;
      },
      { manifest: 0, outturn: 0, weight: 0, cbm: 0, surplus: 0, short: 0, damaged: 0 }
    );

    return {
      containerNo,
      masterJobNo: masterJobData?.MasterJobNumber || '',
      vesselVoyage: joinNonEmpty([masterJobData?.voyages?.[0]?.VesselName, masterJobData?.voyages?.[0]?.VoyageNo], ' / '),
      agent: getAgentName(masterJobData?.DestinationAgent),
      shed: getYardName(masterOther?.Yard || masterOther?.CFS),
      seal: masterJobData?.containers?.[0]?.LineSeal || '',
      remarks: masterOther?.InternalNote || '',
      rows,
      totals,
    };
  });

  return {
    reportTitle: 'CFS Outturn Report',
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
    pages,
    config: {
      pageOrientation: 'landscape'
    }
  };
}
