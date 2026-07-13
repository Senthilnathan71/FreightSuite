import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { buildCompanyHeader } from '../builders/pdf-header.builder';
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
  printSettings?: {
    logoPosition: 'left' | 'center' | 'right';
    companyPosition: 'left' | 'center' | 'right';
    companyAlignment: 'left' | 'center' | 'right';
  };
  partyBlocks: ProofOfDeliveryPartyBlock[];
  jobInfo: ProofOfDeliveryJobInfo;
  products: ProofOfDeliveryProductRow[];
  remarks: string;
  isSea: boolean;
  isLcl: boolean;
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
    pageMargins: data.config?.pageMargins || [15, 82, 15, 46],
    header: (_currentPage: number, _pageCount: number, pageSize: any) => ({
      stack: [
        buildCompanyHeader(data),
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: pageSize.width - 30,
              y2: 0,
              lineWidth: 0.25,
              lineColor: '#000'
            }
          ],
          margin: [0, 4, 0, 0]
        }
      ],
      margin: [15, 10, 15, 0]
    }),
    background: (_: number, pageSize: any) => ({
      canvas: [{
        type: 'rect',
        x: 14,
        y: 14,
        w: pageSize.width - 28,
        h: pageSize.height - 28,
        lineWidth: 0.25,
        lineColor: '#000'
      }]
    }),
    content: [
      buildTitle(data),
      ...buildPartyBlocks(data.partyBlocks),
      buildJobInfoSection(data.jobInfo),
      buildProductsTable(data.products, data.isSea, data.isLcl),
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

function buildTitle(data: ProofOfDeliveryPdfData): any {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: data.reportTitle,
            bold: true,
            alignment: 'center',
            fontSize: 12,
            margin: [0, 3, 0, 3]
          }
        ]
      ]
    },
    layout: {
      hLineWidth: (i: number) => (i === 0 || i === 1 ? 0.5 : 0),
      vLineWidth: () => 0,
      hLineColor: () => '#000',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
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

function buildProductsTable(rows: ProofOfDeliveryProductRow[], isSea: boolean, isLcl: boolean): any {
  const header = isSea
    ? ['Commodity', 'No.of Container', 'Type', 'Pkgs', 'Volume', 'Net Wt.', 'Gross Wt.']
    : ['Commodity', 'Pkgs', 'Volume', 'Net Wt.', 'Gross Wt.'];

  const widths = isSea
    ? ['*', 70, 70, 45, 55, 55, 55]
    : ['*', 45, 55, 55, 55];

  if (isLcl) {
    header.push('Volume Wt.');
    widths.push(55);
  }

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
      buildNumberCell(row.grossWeight, 3)
    );

    if (isLcl) {
      rowCells.push(buildNumberCell(row.volumeWeight, 3));
    }

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
    hLineWidth: () => 0.25,
    vLineWidth: (i: number, node: any) =>
      i === 0 || i === node.table.widths.length ? 0 : 0.25,
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
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  }
): ProofOfDeliveryPdfData {
  const portList = options?.portList || [];
  const containerTypeList = options?.containerTypeList || [];
  const selectedFclLcl = (options?.selectedFclLcl || '').toUpperCase();
  const isSea = selectedFclLcl === 'FCL' || selectedFclLcl === 'LCL';
  const isLcl = selectedFclLcl === 'LCL';

  const getPortName = (portCode: string): string => {
    if (!portCode) return '';
    const port = portList.find((item: any) => item?.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  };

  const getContainerName = (sid: number): string => {
    if (!sid || !containerTypeList.length) return '';
    return containerTypeList.find((c: any) => c.ContainerTypeMasterSid === sid)?.ContainerName || '';
  };

  const productsSource = housejobData?.Products?.length
    ? housejobData.Products
    : (housejobData?.Cargo || []).map((cargo: any) => ({
        ProductName: cargo?.CommodityDescription,
        CommodityDescription: cargo?.CommodityDescription,
        ContainerNo: cargo?.ContainerNo || cargo?.NoofContainers || '',
        ContainerType: cargo?.ContainerType,
        ExternlQty: cargo?.ExternlQty ?? cargo?.NoOfPackage,
        NoOfPackage: cargo?.NoOfPackage,
        Volume: cargo?.Volume,
        NetWeight: cargo?.NetWeight,
        GrossWeight: cargo?.GrossWeight,
        Volumetric: cargo?.Volumetric
      }));

  const products: ProofOfDeliveryProductRow[] = productsSource.map((item: any) => ({
    commodity: item?.ProductName || item?.CommodityDescription || '',
    containerNo: item?.ContainerNo || '',
    containerType: getContainerName(item?.masterJobContainer?.ContainerType || item?.ContainerType),
    pkgs: item?.ExternlQty ?? item?.NoOfPackage ?? 0,
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
    printSettings: options?.printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
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
    remarks: housejobData?.InternalNote || housejobData?.Others?.[0]?.InternalNote || '',
    isSea,
    isLcl,
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
