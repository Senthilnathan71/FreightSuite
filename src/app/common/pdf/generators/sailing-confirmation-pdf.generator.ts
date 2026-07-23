/**
 * Sailing Confirmation PDF Generator
 * Generates Sailing Confirmation PDF based on house job data
 */

import { SailingConfirmationPdfData } from '../interfaces/pdf-document.interfaces';
import { buildCompanyHeader } from '../builders/pdf-header.builder';
import { buildTitle } from '../builders/pdf-section.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG } from '../styles/pdf-styles';
import { formatDate } from '../helpers/pdf-formatters';

function buildSailingHeader(data: SailingConfirmationPdfData): any {
  return {
    stack: [buildCompanyHeader(data)],
    margin: [10, 10, 10, 0]
  };
}

export function generateSailingConfirmationDocument(data: SailingConfirmationPdfData): any {
  const containerText = (data.sailing?.containerList || []).filter(Boolean).join(', ');
  const jobNumberForLetter = data.sailing?.masterJobNumber || data.sailing?.mblNo || '';

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || [20, 82, 20, 20],
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
    header: () => buildSailingHeader(data),
    content: [
      buildTitle('Sailing Confirmation', {
        lineWidth: 555,
        lineThickness: 0.25,
        linePadding: 0,
        margin: [0, 0, 0, 8]
      }),
      buildSailingDetails(data),
      buildLetterSection(data, containerText, jobNumberForLetter)
    ],
    footer: (currentPage: number, pageCount: number) =>
      buildSailingFooter(data, currentPage, pageCount),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function buildSailingDetails(data: SailingConfirmationPdfData): any {
  const leftItems = [
    { label: 'MBL No.', value: data.sailing?.mblNo || '' },
    { label: 'ETA', value: formatDate(data.sailing?.eta) },
    { label: 'Container', value: (data.sailing?.containerList || []).filter(Boolean).join(', ') },
    { label: 'Shipment No', value: data.sailing?.shipmentNo || '' },
    { label: 'Place of Receipt', value: data.sailing?.placeOfReceipt || '' },
    { label: 'Port of Loading', value: data.sailing?.portOfLoading || '' },
    { label: 'Final Destination', value: data.sailing?.finalDestination || '' },
    { label: 'Carrier', value: data.sailing?.carrier || '' },
    { label: 'PP/CC', value: data.sailing?.freightTerms || '' }
  ];

  const rightItems = [
    { label: 'HBL No.', value: data.sailing?.hblNo || '' },
    { label: 'ETD', value: formatDate(data.sailing?.etd) },
    { label: 'Vessel', value: data.sailing?.vesselName || '' },
    { label: 'Voyage', value: data.sailing?.voyageNo || '' },
    { label: 'Job No.', value: data.sailing?.jobNo || '' },
    { label: 'Port of Receipt', value: data.sailing?.portOfReceipt || '' },
    { label: 'Port of Discharge', value: data.sailing?.portOfDischarge || '' },
    { label: 'Place of Delivery', value: data.sailing?.placeOfDelivery || '' },
    { label: 'Movement Type', value: data.sailing?.movementType || '' }
  ];

  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: buildDetailRows(leftItems, 95), margin: [6, 6, 6, 6] },
        { stack: buildDetailRows(rightItems, 100), margin: [6, 6, 6, 6] }
      ]]
    },
    layout: {
      hLineWidth: () => 0.25,
      vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 0.25 : 0),
      hLineColor: () => '#000000',
      vLineColor: () => '#000000'
    },
    margin: [0, 0, 0, 2]
  };
}

function buildDetailRows(items: Array<{ label: string; value: string }>, labelWidth: number): any[] {
  return items.map(item => ({
    columns: [
      { text: item.label, style: 'labelBold', fontSize: 10, width: labelWidth },
      { text: ':', width: 3 },
      { text: item.value || '', fontSize: 10, width: '*', margin: [2, 0, 0, 0] }
    ],
    margin: [0, 2, 0, 2]
  }));
}

function buildLetterSection(
  data: SailingConfirmationPdfData,
  containerText: string,
  jobNumberForLetter: string
): any {
  const eta = formatDate(data.sailing?.eta);
  const etd = formatDate(data.sailing?.etd);

  return {
    stack: [
      { text: 'Dear Sir,', style: 'labelBold', margin: [0, 0, 0, 4] },
      {
        text: [
          'We are pleased to advice you the dispatch of your shipment.\n',
          { text: 'MBL No : ', bold: true },
          jobNumberForLetter,
          { text: ' , HBL No : ', bold: true },
          data.sailing?.hblNo || '',
          { text: ' , Container No : ', bold: true },
          containerText || '',
          ' Sailed onboard on ',
          eta,
          { text: ' Voyage No : ', bold: true },
          data.sailing?.voyageNo || '',
          ' expected to arrive in ',
          etd,
          ' our invoice no amount would be obliged with your early payment.'
        ],
        fontSize: 10,
        margin: [0, 0, 0, 6]
      }
    ],
    margin: [0, 5, 0, 10]
  };
}

function buildSailingFooter(
  data: SailingConfirmationPdfData,
  currentPage?: number,
  pageCount?: number
): any {
  return {
    columns: [
      {
        text: `Printed By: ${data.userData?.userName || ''}`,
        fontSize: 7,
        alignment: 'left',
        width: 120
      },
      {
        text: 'This document is computer-generated and does not require a signature.',
        fontSize: 7,
        alignment: 'center',
        width: '*'
      },
      {
        text: `Printed On: ${formatDate(new Date())}`,
        fontSize: 7,
        alignment: 'right',
        width: 120
      },
      {
        text: currentPage && pageCount ? `Page ${currentPage} of ${pageCount}` : '',
        fontSize: 7,
        alignment: 'right',
        width: 60
      }
    ],
    margin: [20, -2, 20, 8]
  };
}

export function transformSailingConfirmationApiData(
  housejobData: any,
  masterJobData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  lookups?: {
    ports?: any[];
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  }
): SailingConfirmationPdfData {
  const containerList: string[] = Array.from(
    new Set<string>(
      (housejobData?.Products || [])
        .map((p: any) => p?.ContainerNo)
        .filter((c: any) => c !== null && c !== undefined && String(c).trim() !== '')
        .map((c: any) => String(c))
    )
  );

  const resolvePortName = (portCodeOrName?: string): string => {
    if (!portCodeOrName) return '';
    const normalized = String(portCodeOrName).trim().toUpperCase();
    const ports = lookups?.ports || [];
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
    printSettings: lookups?.printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
    sailing: {
      mblNo: housejobData?.masterJob?.MBLNo || masterJobData?.MBLNo || '',
      hblNo: housejobData?.HBLNo || '',
      eta: housejobData?.ETA,
      etd: housejobData?.ETD,
      containerList,
      shipmentNo: housejobData?.ShipmentNo || '',
      placeOfReceipt: resolvePortName(housejobData?.POO),
      portOfLoading: resolvePortName(housejobData?.POL),
      finalDestination: resolvePortName(housejobData?.FPD),
      carrier: housejobData?.CarrierName || '',
      freightTerms: housejobData?.FreightTerms || '',
      vesselName: housejobData?.VesselName || '',
      voyageNo: housejobData?.VoyageNo || '',
      jobNo: housejobData?.masterJob?.MasterJobNumber || masterJobData?.MasterJobNumber || '',
      portOfReceipt: resolvePortName(housejobData?.POL),
      portOfDischarge: resolvePortName(housejobData?.POD),
      placeOfDelivery: resolvePortName(housejobData?.Others?.[0]?.DeliveryAddress),
      movementType: housejobData?.Cargo?.[0]?.MovementType || '',
      masterJobNumber: housejobData?.masterJob?.MasterJobNumber || masterJobData?.MasterJobNumber || ''
    }
  };
}
