import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { getPdfStyles } from '../styles/pdf-styles';

interface ProofOfDeliveryPartyBlock {
  leftTitle: string;
  leftLines: string[];
  rightTitle: string;
  rightLines: string[];
}

interface ProofOfDeliveryJobInfo {
  left: Array<{ label: string; value: string }>;
  right: Array<{ label: string; value: string }>;
}

interface ProofOfDeliveryProductRow {
  commodity: string;
  containerNo?: string;
  containerType?: string;
  pkgs: number | string;
  volume: number;
  netWeight: number;
  grossWeight: number;
  volumeWeight: number;
}

interface ProofOfDeliveryReceivingSection {
  left: string[];
  right: string[];
}

export interface ProofOfDeliveryPdfData {
  reportTitle: string;
  company: any;
  branch: any;
  userData: any;
  logo?: string;
  partyBlocks: ProofOfDeliveryPartyBlock[];
  jobInfo: ProofOfDeliveryJobInfo;
  products: ProofOfDeliveryProductRow[];
  remarks: string;
  isSea: boolean;
  receivingSection: ProofOfDeliveryReceivingSection;
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

function toDisplayDate(value: any): string {
  if (!value) return '';
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(trimmed)) return trimmed;
  }
  return formatDate(value);
}

export function generateProofOfDeliveryDocument(data: ProofOfDeliveryPdfData): any {
  return {
    pageSize: data.config?.pageSize || 'A4',
    pageOrientation: data.config?.pageOrientation || 'portrait',
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
      ...buildPartyBlocks(data.partyBlocks),
      buildJobInfoSection(data.jobInfo),
      buildProductsTable(data.products, data.isSea),
      buildRemarks(data.remarks),
      buildReceivedStatement(),
      buildReceivingSection(data.receivingSection)
    ],
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    styles: getProofOfDeliveryStyles(),
    defaultStyle: {
      fontSize: 10,
      color: '#000'
    }
  };
}

function buildHeader(data: ProofOfDeliveryPdfData): any {
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
            x2: 565,
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

function buildTitle(data: ProofOfDeliveryPdfData): any {
  return {
    text: data.reportTitle,
    bold: true,
    alignment: 'center',
    fontSize: 12,
    margin: [0, 0, 0, 6]
  };
}

function buildPartyBlocks(blocks: ProofOfDeliveryPartyBlock[]): any[] {
  return blocks.map((block, index) => ({
    table: {
      widths: ['50%', '50%'],
      body: [[
        buildPartyCell(block.leftTitle, block.leftLines),
        buildPartyCell(block.rightTitle, block.rightLines)
      ]]
    },
    layout: borderedLayout(),
    margin: [0, index === 0 ? 0 : 4, 0, 4]
  }));
}

function buildPartyCell(title: string, lines: string[]): any {
  return {
    stack: [
      { text: title, style: 'sectionLabel', margin: [0, 0, 0, 4] },
      { text: lines.filter(Boolean).join('\n'), style: 'valueText', margin: [12, 0, 0, 0] }
    ],
    margin: [6, 6, 6, 12]
  };
}

function buildJobInfoSection(info: ProofOfDeliveryJobInfo): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: info.left.map(row => buildKeyValueRow(row.label, row.value)), border: [true, true, false, true] },
        { stack: info.right.map(row => buildKeyValueRow(row.label, row.value)), border: [false, true, true, true] }
      ]]
    },
    layout: borderedLayout(),
    margin: [0, 0, 0, 6]
  };
}

function buildKeyValueRow(label: string, value?: string, labelWidth = 110): any {
  return {
    columns: [
      { text: label, width: labelWidth, style: 'sectionLabel' },
      { text: ':', width: 8 },
      { text: value || '', width: '*', style: 'valueText' }
    ],
    margin: [6, 2, 6, 2]
  };
}

function buildProductsTable(rows: ProofOfDeliveryProductRow[], isSea: boolean): any {
  const header = isSea
    ? ['Commodity', 'Container', 'Type', 'Pkgs', 'Volume', 'Net Wt.', 'Gross Wt.', 'Volume Wt.']
    : ['Commodity', 'Pkgs', 'Volume', 'Net Wt.', 'Gross Wt.', 'Volume Wt.'];

  const widths = isSea
    ? ['*', 70, 50, 45, 55, 55, 55, 55]
    : ['*', 45, 55, 55, 55, 55];

  const body = rows.map((row) => {
    const rowCells = [
      buildTextCell(row.commodity),
    ];

    if (isSea) {
      rowCells.push(buildTextCell(row.containerNo || '', false, 'center'));
      rowCells.push(buildTextCell(row.containerType || '', false, 'center'));
    }

    rowCells.push(
      buildNumberCell(row.pkgs, 0),
      buildNumberCell(row.volume, 3),
      buildNumberCell(row.netWeight, 3),
      buildNumberCell(row.grossWeight, 3),
      buildNumberCell(row.volumeWeight, 3)
    );

    return rowCells;
  });

  return {
    table: {
      headerRows: 1,
      widths,
      body: [
        header.map((text) => ({ text, style: 'tableHeader', alignment: 'center' })),
        ...body
      ]
    },
    layout: borderedLayout(),
    margin: [0, 0, 0, 8]
  };
}

function buildRemarks(remarks: string): any {
  return {
    columns: [
      { text: 'Remarks', style: 'sectionLabel', width: 110, margin: [6, 0, 0, 0] },
      { text: ':', width: 8 },
      { text: remarks || '', width: '*', style: 'valueText' }
    ],
    margin: [0, 4, 0, 6]
  };
}

function buildReceivedStatement(): any {
  return {
    text: 'Received the above goods in good condition',
    alignment: 'center',
    bold: true,
    margin: [0, 4, 0, 8]
  };
}

function buildReceivingSection(section: ProofOfDeliveryReceivingSection): any {
  const buildLines = (lines: string[]) => lines.map((label) => buildKeyValueRow(label, '', 140));

  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: buildLines(section.left), border: [true, true, false, true] },
        { stack: buildLines(section.right), border: [false, true, true, true] }
      ]]
    },
    layout: borderedLayout(),
    margin: [0, 0, 0, 0]
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
  value?: number | string,
  decimals = 3,
  bold = false
): any {
  if (value === '' || value === null || value === undefined) {
    return { text: '', style: bold ? 'tableCellBold' : 'tableCell', alignment: 'right' };
  }
  const num = typeof value === 'string' ? Number(value) : value;
  return {
    text: formatNumberWithCommas(Number(num) || 0, decimals),
    style: bold ? 'tableCellBold' : 'tableCell',
    alignment: 'right'
  };
}

function borderedLayout(): any {
  return {
    hLineWidth: () => 1,
    vLineWidth: (i: number, node: any) =>
      i === 0 || i === node.table.widths.length ? 0 : 1,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingTop: () => 6,
    paddingBottom: () => 6,
    paddingLeft: () => 4,
    paddingRight: () => 4
  };
}

function getProofOfDeliveryStyles(): any {
  return {
    ...getPdfStyles(),
    sectionLabel: { fontSize: 9, bold: true },
    valueText: { fontSize: 9 },
    tableHeader: { fontSize: 8, bold: true, alignment: 'center' },
    tableCell: { fontSize: 8 },
    tableCellBold: { fontSize: 8, bold: true }
  };
}

function buildFooter(data: ProofOfDeliveryPdfData, currentPage: number, pageCount: number): any {
  return {
    margin: [24, 0, 24, 12],
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, alignment: 'left', width: '30%', fontSize: 7, noWrap: true },
      { text: 'This document is computer-generated and does not require a signature.', alignment: 'center', width: '*', fontSize: 7, noWrap: true },
      { text: `Printed On : ${formatDate(new Date())}  Page ${currentPage} of ${pageCount}`, alignment: 'right', width: '30%', fontSize: 7, noWrap: true }
    ]
  };
}

export function transformProofOfDeliveryApiData(
  housejobData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    portList?: any[];
    containerTypeList?: any[];
    selectedFclLcl?: string;
  }
): ProofOfDeliveryPdfData {
  const portList = options?.portList || [];
  const containerTypeList = options?.containerTypeList || [];
  const selectedFclLcl = (options?.selectedFclLcl || '').toUpperCase();
  const isSea = selectedFclLcl === 'FCL' || selectedFclLcl === 'LCL';

  const getPortName = (portCode: string): string => {
    if (!portCode) return '';
    const port = portList.find((item: any) => item?.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  };

  const getContainerName = (sid: number): string => {
    if (!sid || !containerTypeList.length) return '';
    return containerTypeList.find((c: any) => c.ContainerTypeMasterSid === sid)?.ContainerName || '';
  };

  const products: ProofOfDeliveryProductRow[] = (housejobData?.Products || []).map((item: any) => ({
    commodity: item?.ProductName || '',
    containerNo: item?.ContainerNo || '',
    containerType: getContainerName(item?.masterJobContainer?.ContainerType),
    pkgs: item?.ExternlQty || 0,
    volume: toNumber(item?.Volume),
    netWeight: toNumber(item?.NetWeight),
    grossWeight: toNumber(item?.GrossWeight),
    volumeWeight: toNumber(item?.Volumetric)
  }));

  const jobLeft: Array<{ label: string; value: string }> = [
    { label: 'Job Ref.', value: housejobData?.masterJob?.MasterJobNumber || '' },
    { label: isSea ? 'HBL No.' : 'HAWB No.', value: housejobData?.HBLNo || '' },
    { label: 'ETA', value: toDisplayDate(housejobData?.ETA) },
    {
      label: isSea ? 'Vessel / Voyage' : 'Flight Name / No.',
      value: joinNonEmpty([housejobData?.VesselName, housejobData?.VoyageNo], ' / ')
    },
    { label: 'Port of Discharge', value: getPortName(housejobData?.POD) },
    { label: 'Place of Delivery', value: getPortName(housejobData?.POD) }
  ];

  const jobRight: Array<{ label: string; value: string }> = [
    { label: 'Shipment Ref.', value: housejobData?.Others?.[0]?.CustomerRefNo || '' },
    { label: 'BOE No.', value: housejobData?.houseJobBOE?.[0]?.BOENo || '' },
    { label: isSea ? 'MBL No.' : 'MAWB No.', value: housejobData?.masterJob?.MBLNo || '' },
    { label: 'ETD', value: toDisplayDate(housejobData?.ETD) },
    { label: 'Carrier', value: housejobData?.CarrierName || '' },
    { label: 'Port of Loading', value: getPortName(housejobData?.POL) },
    { label: 'Final Destination', value: getPortName(housejobData?.FPD) }
  ];

  return {
    reportTitle: 'Proof of Delivery',
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
    partyBlocks: [
      {
        leftTitle: 'Client',
        leftLines: [housejobData?.CustomerName || '', housejobData?.CustomerAddress || ''],
        rightTitle: 'Delivery To',
        rightLines: [housejobData?.Others?.[0]?.DeliveryPlace || '']
      },
      {
        leftTitle: 'Consignee',
        leftLines: [housejobData?.ConsigneeName || '', housejobData?.ConsigneeAddress || ''],
        rightTitle: 'Shipper',
        rightLines: [housejobData?.ShipperName || '', housejobData?.ShipperAddress || '']
      }
    ],
    jobInfo: { left: jobLeft, right: jobRight },
    products,
    remarks: housejobData?.InternalNote || '',
    isSea,
    receivingSection: {
      left: [
        'Delivery Received',
        'Truck No.',
        'Driver Name',
        'Truck Out Date',
        'Delivery (Date & Time)',
        'Arrival at Site (Date & Time)',
        'Offloading Start (Date & Time)'
      ],
      right: [
        'Offloading Finish (Date & Time)',
        'Cargo Received',
        'Name',
        'Sign & Seal',
        'Mobile No.',
        'Date & Time'
      ]
    },
    config: {
      pageOrientation: 'portrait'
    }
  };
}
