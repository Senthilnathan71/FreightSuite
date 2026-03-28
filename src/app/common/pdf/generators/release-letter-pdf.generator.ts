/**
 * Release Letter PDF Generator
 * Mirrors release-letter.component.html layout
 */

import { ReleaseLetterPdfData } from '../interfaces/pdf-document.interfaces';
import { PDF_DEFAULT_CONFIG, getPdfStyles, PDF_TABLE_LAYOUTS } from '../styles/pdf-styles';
import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';

const LOGO_HEIGHT_PX = 100;
const LOGO_HEIGHT_PT = LOGO_HEIGHT_PX * 0.75;

export function generateReleaseLetterDocument(data: ReleaseLetterPdfData): any {
  const configuredMargins = data.config?.pageMargins as number[] | undefined;
  const resolvedPageMargins = configuredMargins
    ? [
        configuredMargins[0] ?? 20,
        configuredMargins[1] ?? 20,
        configuredMargins[2] ?? 20,
        configuredMargins[3] ?? 25
      ]
    : [20, 20, 20, 25];

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: resolvedPageMargins,
    background: (currentPage: number, pageSize: any) => ({
      canvas: [
        { type: 'line', x1: 10, y1: 10, x2: 10, y2: pageSize.height - 10, lineWidth: 0.8 },
        { type: 'line', x1: pageSize.width - 10, y1: 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.8 },
        { type: 'line', x1: 10, y1: 10, x2: pageSize.width - 10, y2: 10, lineWidth: 0.8 },
        { type: 'line', x1: 10, y1: pageSize.height - 10, x2: pageSize.width - 10, y2: pageSize.height - 10, lineWidth: 0.8 }
      ]
    }),
    content: [
      buildHeader(data),
      buildTitle(),
      buildInfoGrid(data),
      buildCargoTitle(),
      ...(data.selectedFclLcl === 'LCL' ? [buildLclTable(data)] : [buildFclTable(data)]),
      buildReleaseToRow(data),
      buildMarksRow(data),
      buildRemarksRow(data),
      buildSignOff(data)
    ],
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    styles: getPdfStyles(),
    defaultStyle: {
      ...PDF_DEFAULT_CONFIG.defaultStyle,
      fontSize: 16,
      color: '#000'
    }
  };
}

function buildHeader(data: ReleaseLetterPdfData): any {
  const company = data.company;
  const branch = data.branch;
  const logo = data.logo;

  const logoColumn = logo
    ? { image: logo, height: LOGO_HEIGHT_PT, alignment: 'left' as const }
    : { text: '', width: LOGO_HEIGHT_PT };

  const addressLine1 = branch?.addressLine1 || company?.addressLine1;
  const addressLine2 = branch?.addressLine2 || company?.addressLine2;
  const cityName = branch?.cityMaster?.cityName || branch?.cityName || company?.city || '';
  const postalCode = branch?.postalCode || company?.postalCode;
  const phone = branch?.phoneNumber || company?.phoneNumber;

  let addressLine2Text = joinNonEmpty([addressLine2, cityName], ', ');
  if (postalCode) {
    addressLine2Text = addressLine2Text
      ? `${addressLine2Text}, Postal Code : ${postalCode}`
      : `Postal Code : ${postalCode}`;
  }
  if (phone) {
    addressLine2Text = addressLine2Text
      ? `${addressLine2Text}, Ph.no : ${phone}`
      : `Ph.no : ${phone}`;
  }

  const companyStack: any[] = [];
  if (company?.companyName) {
    companyStack.push({
      text: (company.companyName || '').toUpperCase(),
      fontSize: 18,
      bold: true,
      alignment: 'center'
    });
  }

  if (branch?.branchName) {
    companyStack.push({
      text: branch.branchName,
      fontSize: 14,
      bold: true,
      alignment: 'center'
    });
  }

  if (addressLine1) {
    companyStack.push({
      text: addressLine1,
      fontSize: 12,
      alignment: 'center'
    });
  }

  if (addressLine2Text) {
    companyStack.push({
      text: addressLine2Text,
      fontSize: 12,
      alignment: 'center'
    });
  }

  return {
    columns: [
      logoColumn,
      { stack: companyStack, width: '*' },
      { text: '', width: LOGO_HEIGHT_PT }
    ],
    margin: [20, 0, 20, 0]
  };
}

function buildTitle(): any {
  return {
    stack: [
      {
        canvas: [{ type: 'line', x1: -10, y1: 0, x2: 565, y2: 0, lineWidth: 0.8 }],
        margin: [0, 10, 0, 0]
      },
      {
        text: 'RELEASE LETTER',
        alignment: 'center',
        bold: true,
        fontSize: 20,
        margin: [0, 8, 0, 6]
      }
    ]
  };
}

function buildInfoGrid(data: ReleaseLetterPdfData): any {
  const info = data.info || {};

  const leftStack = [
    buildInfoRow('CFS', info.cfs || ''),
    buildInfoRow('Attn.', info.attn || ''),
    buildInfoRow('Shipper', info.shipper || ''),
    buildInfoRow('Vessel', info.vessel || ''),
    buildInfoRow('Voyage', info.voyage || '')
  ];

  const rightStack = [
    buildInfoRow('Date', info.date ? formatDate(info.date) : '', 150),
    buildInfoRow('Your Booking Ref.', info.yourBookingRef || '', 150),
    buildInfoRow('Our Booking Ref.', info.ourBookingRef || '', 150),
    buildInfoRow('Port Of Discharge', info.portOfDischarge || '', 150),
    buildInfoRow('Final Destination', info.finalDestination || '', 150)
  ];

  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: leftStack, margin: [0, 0, 0, 0] },
        { stack: rightStack, margin: [0, 0, 0, 0] }
      ]]
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 20,
      paddingRight: () => 20,
      paddingTop: () => 8,
      paddingBottom: () => 8
    },
    margin: [0, 0, 0, 6]
  };
}

function buildInfoRow(label: string, value: string, labelWidth = 100): any {
  return {
    columns: [
      { text: label, width: labelWidth, bold: true, fontSize: 16 },
      { text: ':', width: 10, fontSize: 16 },
      { text: value || '', width: '*', fontSize: 16 }
    ],
    margin: [0, 0, 0, 4]
  };
}

function buildCargoTitle(): any {
  return {
    text: 'CARGO DETAILS',
    bold: true,
    fontSize: 16,
    margin: [25, 6, 0, 2]
  };
}

function buildFclTable(data: ReleaseLetterPdfData): any {
  const cargo = data.cargo || {};
  return {
    table: {
      headerRows: 1,
      widths: [90, '*', 70, 80, 80],
      body: [
        [
          { text: 'No.Container', bold: true, alignment: 'center', noWrap: true },
          { text: 'Container Type', bold: true, alignment: 'center' },
          { text: 'No. of Pkgs', bold: true, alignment: 'center', noWrap: true },
          { text: 'Gross Weight', bold: true, alignment: 'center', noWrap: true },
          { text: 'Volume', bold: true, alignment: 'center', noWrap: true }
        ],
        [
          { text: String(cargo.noOfContainers || ''), alignment: 'right' },
          { text: cargo.containerType || '', alignment: 'left' },
          { text: String(cargo.noOfPackages || ''), alignment: 'right' },
          { text: formatNumberWithCommas(Number(cargo.grossWeight || 0), 3), alignment: 'right' },
          { text: formatNumberWithCommas(Number(cargo.volume || 0), 3), alignment: 'right' }
        ]
      ]
    },
    layout: PDF_TABLE_LAYOUTS.bordered,
    margin: [0, 2, 0, 6]
  };
}

function buildLclTable(data: ReleaseLetterPdfData): any {
  const cargo = data.cargo || {};
  return {
    table: {
      headerRows: 1,
      widths: ['*', '*', '*'],
      body: [
        [
          { text: 'No. of Pkgs', bold: true, alignment: 'center' },
          { text: 'Gross Weight', bold: true, alignment: 'center' },
          { text: 'Volume', bold: true, alignment: 'center' }
        ],
        [
          { text: String(cargo.noOfPackages || ''), alignment: 'right' },
          { text: formatNumberWithCommas(Number(cargo.grossWeight || 0), 3), alignment: 'right' },
          { text: formatNumberWithCommas(Number(cargo.volume || 0), 3), alignment: 'right' }
        ]
      ]
    },
    layout: PDF_TABLE_LAYOUTS.bordered,
    margin: [0, 2, 0, 6]
  };
}

function buildReleaseToRow(data: ReleaseLetterPdfData): any {
  return {
    columns: [
      { text: 'Please release the above mentioned booking to', bold: true, width: 355 },
      { text: `:  ${data.releaseTo || ''}`, width: '*' }
    ],
    margin: [25, 16, 0, 8]
  };
}

function buildMarksRow(data: ReleaseLetterPdfData): any {
  return {
    columns: [
      { text: 'Mark and No.', bold: true, width: 105 },
      { text: `: ${data.cargo?.marksAndNumber || ''}`, width: '*' }
    ],
    margin: [25, 0, 0, 10]
  };
}

function buildRemarksRow(data: ReleaseLetterPdfData): any {
  return {
    columns: [
      { text: 'Remarks', bold: true, width: 105 },
      { text: `: ${data.remarks || ''}`, width: '*' }
    ],
    margin: [25, 12, 0, 10]
  };
}

function buildSignOff(data: ReleaseLetterPdfData): any {
  return {
    stack: [
      { text: "YOUR'S SINCERELY", bold: true, margin: [0, 0, 0, 6] },
      { text: data.company?.companyName || 'Company Name', bold: true }
    ],
    margin: [28, 14, 0, 0]
  };
}

function buildFooter(data: ReleaseLetterPdfData, currentPage: number, pageCount: number): any {
  const disclaimerText = 'This document is computer-generated and does not require a signature.';
  return {
    columns: [
      {
        text: `Printed By : ${data.userData?.userName || ''}`,
        fontSize: 7,
        alignment: 'left',
        width: '25%',
        noWrap: true
      },
      {
        text: disclaimerText,
        fontSize: 7,
        alignment: 'center',
        noWrap: true,
        width: '*'
      },
      {
        text: `Printed On : ${formatDate(new Date())}  Page ${currentPage} of ${pageCount}`,
        fontSize: 7,
        alignment: 'right',
        width: '30%',
        noWrap: true
      }
    ],
    margin: [30, 0, 30, 5]
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
    portList?: any[];
    selectedFclLcl?: 'FCL' | 'LCL';
    cfsList?: any[];
  }
): ReleaseLetterPdfData {
  const cargo = apiData?.Cargo?.[0] || {};
  const others = apiData?.Others?.[0] || {};

  const getPortName = (portCode?: string): string => {
    if (!portCode) return '';
    const port = (options?.portList || []).find((item: any) => item.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  };

  const getContainerName = (containerTypeMasterSid?: number): string => {
    if (!containerTypeMasterSid) return '';
    const match = (options?.containerTypeList || []).find((item: any) => item.ContainerTypeMasterSid === containerTypeMasterSid);
    return match?.ContainerName || '';
  };

  const getCfsName = (cfsSid?: number | string): string => {
    if (!cfsSid) return '';
    const list = options?.cfsList || [];
    const match = list.find((item: any) =>
      item.CustomerMasterSid === cfsSid || item.CfsMasterSid === cfsSid || item.customerMasterSid === cfsSid
    );
    return match?.CustomerName || match?.CfsName || String(cfsSid);
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
      userName: userData?.UserName || userData?.userName || ''
    },
    logo,
    selectedFclLcl: options?.selectedFclLcl || apiData?.selectedFclLcl || 'FCL',
    info: {
      cfs: getCfsName(others?.YardCFS) || String(others?.YardCFS || ''),
      attn: '',
      shipper: apiData?.ShipperName || '',
      vessel: apiData?.VesselName || '',
      voyage: apiData?.VoyageNo || '',
      date: apiData?.HBLDate || '',
      yourBookingRef: others?.CustomerRefNo || '',
      ourBookingRef: apiData?.BookingNo || '',
      portOfDischarge: getPortName(apiData?.POD),
      finalDestination: getPortName(apiData?.FPD)
    },
    cargo: {
      noOfContainers: cargo?.NoofContainers || '',
      containerType: getContainerName(cargo?.ContainerType),
      noOfPackages: cargo?.NoOfPackage || '',
      grossWeight: cargo?.GrossWeight || '',
      volume: cargo?.Volume || '',
      marksAndNumber: cargo?.MarksAndNumber || ''
    },
    releaseTo: apiData?.CustomerName || '',
    remarks: apiData?.InternalNote || ''
  };
}
