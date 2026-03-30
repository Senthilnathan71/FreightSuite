import {
  ReleaseLetterFclCargoRow,
  ReleaseLetterPdfData
} from '../interfaces/pdf-document.interfaces';
import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { getPdfStyles } from '../styles/pdf-styles';

function toNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function generateReleaseLetterDocument(data: ReleaseLetterPdfData): any {
  const isFcl = (data.selectedFclLcl || '').toUpperCase() === 'FCL';

  return {
    pageSize: data.config?.pageSize || 'A4',
    pageOrientation: 'portrait',
    pageMargins: [15, 10, 15, 28],
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
      buildHeader(data),
      buildTitle(data),
      buildInfoSection(data),
      buildCargoHeading(),
      isFcl ? buildFclTable(data.fclCargo) : buildLclTable(data),
      buildReleaseToSection(data),
      buildMarksSection(data),
      buildRemarksSection(data),
      buildSignatureSection(data)
    ],
    footer: () => buildFooter(data),
    styles: getReleaseLetterStyles(),
    defaultStyle: {
      fontSize: 10,
      color: '#000'
    }
  };
}

function buildHeader(data: ReleaseLetterPdfData): any {
  const company: any = data.company || {};
  const branch: any = data.branch || {};
  const locationLine = joinNonEmpty([
    branch?.addressLine2 || company?.addressLine2 || '',
    branch?.cityName || branch?.cityMaster?.cityName || company?.city || '',
    (branch?.postalCode || company?.postalCode) ? `Postal Code : ${branch?.postalCode || company?.postalCode}` : '',
    (branch?.phoneNumber || company?.phoneNumber) ? `Ph.no : ${branch?.phoneNumber || company?.phoneNumber}` : ''
  ], ', ');
  const detailLine1 = branch?.addressLine1 || company?.addressLine1 || '';
  const companyInfoStack = [
    { text: (company?.companyName || '').toUpperCase(), bold: true, fontSize: 14, alignment: 'center' },
    { text: branch?.branchName || '', bold: true, fontSize: 11, alignment: 'center', margin: [0, 1, 0, 0] },
    { text: detailLine1, fontSize: 9, alignment: 'center', margin: [0, 1, 0, 0] },
    { text: locationLine, fontSize: 9, alignment: 'center', margin: [0, 1, 0, 0] }
  ];

  const buildSlot = (slot: 'left' | 'center' | 'right') => {
    const stack: any[] = [];
    if (slot === 'left' && data.logo) {
      stack.push({
        image: data.logo,
        fit: [55, 55],
        alignment: 'left',
        margin: [6, 0, 0, 0]
      });
    }
    if (slot === 'center') {
      stack.push({ stack: companyInfoStack });
    }
    return { stack };
  };

  return {
    table: {
      widths: ['20%', '60%', '20%'],
      body: [[buildSlot('left'), buildSlot('center'), buildSlot('right')]]
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [0, 6, 0, 6]
  };
}

function buildTitle(data: ReleaseLetterPdfData): any {
  return {
    table: {
      widths: ['*'],
      body: [[{ text: data.reportTitle, bold: true, alignment: 'center', fontSize: 12, margin: [0, 4, 0, 4] }]]
    },
    layout: {
      hLineWidth: (i: number) => (i === 0 ? 1 : 0),
      vLineWidth: () => 0,
      hLineColor: () => '#000'
    },
    margin: [0, 0, 0, 6]
  };
}

function buildInfoSection(data: ReleaseLetterPdfData): any {
  const info = data.releaseInfo;
  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        {
          stack: [
            buildKeyValueRow('CFS', info.cfs || '', 100),
            buildKeyValueRow('Attn.', info.attention || '', 100),
            buildKeyValueRow('Shipper', info.shipper || '', 100),
            buildKeyValueRow('Vessel', info.vessel || '', 100),
            buildKeyValueRow('Voyage', info.voyage || '', 100)
          ],
          border: [true, true, false, true],
          margin: [10, 4, 0, 4]
        },
        {
          stack: [
            buildKeyValueRow('Date', formatDate(info.date), 120),
            buildKeyValueRow('Your Booking Ref.', info.customerBookingRef || '', 120),
            buildKeyValueRow('Our Booking Ref.', info.bookingRef || '', 120),
            buildKeyValueRow('Port Of Discharge', info.portOfDischarge || '', 120),
            buildKeyValueRow('Final Destination', info.finalDestination || '', 120)
          ],
          border: [false, true, true, true],
          margin: [2, 4, 5, 4]
        }
      ]]
    },
    layout: boxedLayout(4, 8),
    margin: [8, 0, 8, 8]
  };
}

function buildCargoHeading(): any {
  return {
    text: 'CARGO DETAILS',
    style: 'sectionTitle',
    margin: [10, 0, 0, 4]
  };
}

function buildFclTable(rows: ReleaseLetterFclCargoRow[]): any {
  return {
    table: {
      headerRows: 1,
      widths: [85, '*', 70, 85, 85],
      body: [
        [
          { text: 'No.Container', style: 'tableHeader' },
          { text: 'Container Type', style: 'tableHeader' },
          { text: 'No. of Pkgs', style: 'tableHeader' },
          { text: 'Gross Weight', style: 'tableHeader' },
          { text: 'Volume', style: 'tableHeader' }
        ],
        ...rows.map((item) => [
          buildNumberCell(item.containerCount, 0),
          buildTextCell(item.containerType),
          buildNumberCell(item.noOfPackages, 0),
          buildNumberCell(item.grossWeight, 3),
          buildNumberCell(item.volume, 3)
        ])
      ]
    },
    layout: borderedLayout(),
    margin: [8, 0, 8, 14]
  };
}

function buildLclTable(data: ReleaseLetterPdfData): any {
  const summary = data.lclCargo || {};
  return {
    table: {
      headerRows: 1,
      widths: ['*', '*', '*'],
      body: [
        [
          { text: 'No. of Pkgs', style: 'tableHeader' },
          { text: 'Gross Weight', style: 'tableHeader' },
          { text: 'Volume', style: 'tableHeader' }
        ],
        [
          buildNumberCell(summary.noOfPackages, 0),
          buildNumberCell(summary.grossWeight, 3),
          buildNumberCell(summary.volume, 3)
        ]
      ]
    },
    layout: borderedLayout(),
    margin: [8, 0, 8, 14]
  };
}

function buildReleaseToSection(data: ReleaseLetterPdfData): any {
  return {
    columns: [
      { text: 'Please release the above mentioned booking to', style: 'label', width: 250, margin: [10, 0, 0, 0] },
      { text: ':', width: 8 },
      { text: data.releaseTo || '', style: 'value', width: '*' }
    ],
    margin: [0, 0, 0, 20]
  };
}

function buildMarksSection(data: ReleaseLetterPdfData): any {
  return {
    columns: [
      { text: 'Mark and No.', style: 'label', width: 105, margin: [10, 0, 0, 0] },
      { text: ':', width: 8 },
      { text: data.marksAndNumber || '', style: 'value', width: '*' }
    ],
    margin: [0, 0, 0, 20]
  };
}

function buildRemarksSection(data: ReleaseLetterPdfData): any {
  return {
    columns: [
      { text: 'Remarks', style: 'label', width: 105, margin: [10, 0, 0, 0] },
      { text: ':', width: 8 },
      { text: data.remarks || '', style: 'value', width: '*' }
    ],
    margin: [0, 0, 0, 24]
  };
}

function buildSignatureSection(data: ReleaseLetterPdfData): any {
  return {
    stack: [
      { text: "YOUR'S SINCERELY", style: 'label', margin: [10, 0, 0, 6] },
      { text: data.signatureCompanyName || 'Company Name', style: 'signatureName', margin: [10, 0, 0, 0] }
    ]
  };
}

function buildFooter(data: ReleaseLetterPdfData): any {
  return {
    margin: [24, 0, 24, 0],
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, alignment: 'left', width: 140, fontSize: 8 },
      { text: 'This document is computer-generated and does not require a signature.', alignment: 'center', width: '*', fontSize: 8, noWrap: true },
      { text: `Printed On : ${formatDate(new Date())}`, alignment: 'right', width: 140, fontSize: 8 }
    ]
  };
}

function buildKeyValueRow(label: string, value?: string, labelWidth = 110): any {
  return {
    columns: [
      { text: label, width: labelWidth, style: 'label' },
      { text: ':', width: 10 },
      { text: value || '', width: '*', style: 'value' }
    ],
    margin: [0, 0, 0, 3]
  };
}

function buildTextCell(value?: string, bold = false): any {
  return {
    text: value || '',
    style: bold ? 'tableCellBold' : 'tableCell'
  };
}

function buildNumberCell(value?: number, decimals = 2, bold = false): any {
  return {
    text: formatNumberWithCommas(toNumber(value), decimals),
    style: bold ? 'tableCellBold' : 'tableCell',
    alignment: 'right'
  };
}

function boxedLayout(padding: number, sidePadding: number): any {
  return {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingTop: () => padding,
    paddingBottom: () => padding,
    paddingLeft: () => sidePadding,
    paddingRight: () => sidePadding
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

function getReleaseLetterStyles(): any {
  return {
    ...getPdfStyles(),
    label: { fontSize: 10, bold: true },
    value: { fontSize: 10 },
    sectionTitle: { fontSize: 11, bold: true },
    signatureName: { fontSize: 10, bold: true },
    tableHeader: { fontSize: 9, bold: true, alignment: 'center' },
    tableCell: { fontSize: 9 },
    tableCellBold: { fontSize: 9, bold: true }
  };
}

export function transformReleaseLetterApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    containerTypeList?: any[];
    selectedFCLLCL?: string;
    portList?: any[];
  }
): ReleaseLetterPdfData {
  const cargo = apiData?.Cargo?.[0] || {};
  const other = apiData?.Others?.[0] || {};

  const getContainerName = (containerTypeMasterSid?: number): string => {
    if (!containerTypeMasterSid) return '';
    const match = (options?.containerTypeList || []).find(
      (item: any) => item.ContainerTypeMasterSid === containerTypeMasterSid
    );
    return match?.ContainerName || '';
  };

  const getPortName = (portCode?: string): string => {
    if (!portCode) return '';
    const match = (options?.portList || []).find((item: any) => item.PortCode === portCode);
    return match ? `${match.PortCode} - ${match.PortName}` : portCode;
  };

  return {
    company: {
      companyName: company?.CompanyName || company?.companyName || '',
      addressLine1: company?.Address || company?.addressLine1 || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || company?.city || '',
      postalCode: company?.ZipCode || company?.postalCode || '',
      phoneNumber: company?.Phone || company?.phoneNumber || ''
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
    reportTitle: 'RELEASE LETTER',
    selectedFclLcl: options?.selectedFCLLCL || '',
    releaseInfo: {
      cfs: other?.YardCFS || '',
      attention: '',
      shipper: apiData?.ShipperName || '',
      vessel: apiData?.VesselName || '',
      voyage: apiData?.VoyageNo || '',
      date: apiData?.HBLDate || '',
      customerBookingRef: other?.CustomerRefNo || '',
      bookingRef: apiData?.BookingNo || '',
      portOfDischarge: getPortName(apiData?.POD),
      finalDestination: getPortName(apiData?.FPD)
    },
    fclCargo: [{
      containerCount: toNumber(cargo?.NoofContainers),
      containerType: getContainerName(cargo?.ContainerType),
      noOfPackages: toNumber(cargo?.NoOfPackage),
      grossWeight: toNumber(cargo?.GrossWeight),
      volume: toNumber(cargo?.Volume)
    }],
    lclCargo: {
      noOfPackages: toNumber(cargo?.NoOfPackage),
      grossWeight: toNumber(cargo?.GrossWeight),
      volume: toNumber(cargo?.Volume)
    },
    releaseTo: apiData?.CustomerName || '',
    marksAndNumber: cargo?.MarksAndNumber || '',
    remarks: apiData?.InternalNote || '',
    signatureCompanyName: company?.companyName || company?.CompanyName || ''
  };
}
