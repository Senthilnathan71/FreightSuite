/**
 * Master Job PDF Generator
 * Generates MBL, Manifest, Job Card, and Packing List PDFs
 */

import { MasterJobPdfData, MasterJobDocumentType, PartyInfo } from '../interfaces/pdf-document.interfaces';
import { buildHeader, buildLeftAlignedHeader } from '../builders/pdf-header.builder';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { buildContainerTable, buildHouseJobsTable, buildChargesTable, buildTwoColumnInfo } from '../builders/pdf-table.builder';
import {
  buildTitle,
  buildSectionTitle,
  buildDivider,
  buildPartyInfo,
  buildRemarks
} from '../builders/pdf-section.builder';
import { getPdfStyles, PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS } from '../styles/pdf-styles';
import { formatDate, formatNumber } from '../helpers/pdf-formatters';

/**
 * Generate master job PDF document based on type
 */
export function generateMasterJobDocument(
  data: MasterJobPdfData,
  documentType: MasterJobDocumentType = 'mbl'
): any {
  switch (documentType) {
    case 'mbl':
      return generateMblDocument(data);
    case 'manifest':
      return generateManifestDocument(data);
    case 'jobCard':
      return generateJobCardDocument(data);
    case 'packingList':
      return generatePackingListDocument(data);
    default:
      return generateMblDocument(data);
  }
}

/**
 * Generate MBL (Master Bill of Lading) document
 */
function generateMblDocument(data: MasterJobPdfData): any {
  const job = data.masterJob;
  const isAir = data.fclLcl === 'AIR';
  const blTitle = isAir ? 'Master Air Waybill' : 'Master Bill of Lading';

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || [30, 30, 30, 50],
    content: [
      // Header
      buildLeftAlignedHeader(data.company, data.branch, data.logo, { compact: true }),

      // Title
      buildTitle(blTitle, { showLine: false }),

      // BL Number and Date
      buildBlHeader(data),

      // Shipper/Consignee/Notify Party
      buildPartiesSection(data),

      // Divider
      buildDivider({ thickness: 2 }),

      // Vessel/Port Information
      buildVesselPortInfo(data),

      // Container/Package Details
      buildSectionTitle('Container/Package Details'),
      buildContainerTable(data.containers || []),

      // Marks and Numbers / Description
      buildGoodsDescription(data),

      // Remarks
      buildRemarks(job?.remarks || '')
    ],
    footer: createFooterFunction(data.userData, { showPageNumbers: true }),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

/**
 * Generate Manifest document (summary of all house shipments)
 */
function generateManifestDocument(data: MasterJobPdfData): any {
  const job = data.masterJob;

  return {
    pageSize: data.config?.pageSize || 'A4',
    pageOrientation: 'landscape',
    pageMargins: [30, 30, 30, 50],
    content: [
      // Header
      buildHeader(data.company, data.branch, data.logo, { compact: true }),

      // Title
      buildTitle('Cargo Manifest'),

      // Master Job Info
      buildManifestHeader(data),

      // Divider
      buildDivider(),

      // House Jobs Summary Table
      buildSectionTitle('House Shipments Summary'),
      buildHouseJobsTable(data.houseJobs || []),

      // Totals
      buildManifestTotals(data)
    ],
    footer: createFooterFunction(data.userData, { showPageNumbers: true }),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

/**
 * Generate Job Card document
 */
function generateJobCardDocument(data: MasterJobPdfData): any {
  const job = data.masterJob;
  const departmentLabel = data.departmentName ? ` - ${data.departmentName}` : '';

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || PDF_DEFAULT_CONFIG.pageMargins,
    content: [
      // Header
      buildHeader(data.company, data.branch, data.logo),

      // Title
      buildTitle(`Job Card${departmentLabel}`),

      // Job Info
      buildJobCardInfo(data),

      // Divider
      buildDivider(),

      // Parties Section
      buildJobCardParties(data),

      // Shipment Details
      buildSectionTitle('Shipment Details'),
      buildShipmentDetailsTable(data),

      // Container Details
      ...(data.containers && data.containers.length > 0 ? [
        buildSectionTitle('Container Details'),
        buildContainerTable(data.containers)
      ] : []),

      // Charges (if available)
      ...(data.charges && data.charges.length > 0 ? [
        buildSectionTitle('Charges'),
        buildChargesTable(
          data.charges.map(c => ({
            ChargeDisplayName: c.chargeName,
            unit: c.unit,
            Qty: c.qty,
            currency: c.currency,
            RevenueRate: c.rate,
            RevenueAmount: c.amount
          })),
          false,
          {}
        )
      ] : []),

      // Remarks
      buildRemarks(job?.remarks || '')
    ],
    footer: createFooterFunction(data.userData),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

/**
 * Generate Packing List document
 */
function generatePackingListDocument(data: MasterJobPdfData): any {
  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: data.config?.pageOrientation || PDF_DEFAULT_CONFIG.pageOrientation,
    pageMargins: data.config?.pageMargins || PDF_DEFAULT_CONFIG.pageMargins,
    content: [
      // Header
      buildHeader(data.company, data.branch, data.logo),

      // Title
      buildTitle('Packing List'),

      // Job Reference
      buildPackingListHeader(data),

      // Divider
      buildDivider(),

      // Shipper/Consignee
      {
        columns: [
          buildPartyInfo('Shipper', data.masterJob?.shipper || {}, { width: '50%' }),
          buildPartyInfo('Consignee', data.masterJob?.consignee || {}, { width: '50%' })
        ],
        margin: [0, 0, 0, 15]
      },

      // Container Details with detailed package info
      buildSectionTitle('Package Details'),
      buildPackingDetailsTable(data),

      // Totals
      buildPackingTotals(data)
    ],
    footer: createFooterFunction(data.userData),
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

// ==================== Helper Functions ====================

/**
 * Build BL header with number and date
 */
function buildBlHeader(data: MasterJobPdfData): any {
  const job = data.masterJob;
  const isAir = data.fclLcl === 'AIR';

  return {
    columns: [
      {
        stack: [
          {
            columns: [
              { text: (isAir ? 'MAWB No:' : 'MBL No:'), style: 'labelBold', width: 80 },
              { text: job?.mblNo || '', width: '*' }
            ]
          },
          {
            columns: [
              { text: 'Job No:', style: 'labelBold', width: 80 },
              { text: job?.jobNo || '', width: '*' }
            ]
          }
        ],
        width: '50%'
      },
      {
        stack: [
          {
            columns: [
              { text: 'Date:', style: 'labelBold', width: 60 },
              { text: formatDate(job?.jobDate), width: '*' }
            ]
          },
          {
            columns: [
              { text: 'Carrier:', style: 'labelBold', width: 60 },
              { text: job?.carrierName || '', width: '*' }
            ]
          }
        ],
        width: '50%',
        alignment: 'right'
      }
    ],
    margin: [0, 0, 0, 15]
  };
}

/**
 * Build parties section (Shipper, Consignee, Notify)
 */
function buildPartiesSection(data: MasterJobPdfData): any {
  const job = data.masterJob;

  return {
    columns: [
      {
        stack: [
          buildPartyInfo('Shipper', job?.shipper || {}, { margin: [0, 0, 0, 10] }),
          buildPartyInfo('Consignee', job?.consignee || {}, { margin: [0, 0, 0, 10] })
        ],
        width: '50%'
      },
      {
        stack: [
          buildPartyInfo('Notify Party', job?.notifyParty || {}, { margin: [0, 0, 0, 10] }),
          buildPartyInfo('Agent', job?.agent || {}, { margin: [0, 0, 0, 10] })
        ],
        width: '50%'
      }
    ],
    margin: [0, 0, 0, 15]
  };
}

/**
 * Build vessel and port information
 */
function buildVesselPortInfo(data: MasterJobPdfData): any {
  const job = data.masterJob;
  const isAir = data.fclLcl === 'AIR';

  const leftItems = [
    { label: isAir ? 'Flight' : 'Vessel', value: job?.vesselName || '' },
    { label: isAir ? 'Flight No' : 'Voyage No', value: job?.voyageNo || '' },
    { label: 'Place of Receipt', value: job?.placeOfReceipt || '' }
  ].filter(i => i.value);

  const rightItems = [
    { label: 'Port of Loading', value: formatPort(job?.pol) },
    { label: 'Port of Discharge', value: formatPort(job?.pod) },
    { label: 'Place of Delivery', value: job?.placeOfDelivery || '' },
    { label: 'ETD', value: formatDate(job?.polEtd) },
    { label: 'ETA', value: formatDate(job?.podEta) }
  ].filter(i => i.value);

  return buildTwoColumnInfo(leftItems, rightItems, { labelWidth: 100, margin: [0, 0, 0, 15] });
}

/**
 * Build goods description section
 */
function buildGoodsDescription(data: MasterJobPdfData): any {
  const job = data.masterJob;
  const content: any[] = [];

  if (job?.marksAndNumbers) {
    content.push({
      stack: [
        { text: 'Marks & Numbers', style: 'labelBold', margin: [0, 0, 0, 3] },
        {
          text: job.marksAndNumbers,
          margin: [0, 0, 0, 10]
        }
      ]
    });
  }

  if (job?.descriptionOfGoods) {
    content.push({
      stack: [
        { text: 'Description of Goods', style: 'labelBold', margin: [0, 0, 0, 3] },
        {
          text: job.descriptionOfGoods,
          margin: [0, 0, 0, 10]
        }
      ]
    });
  }

  return content.length > 0 ? { stack: content, margin: [0, 10, 0, 10] } : { text: '' };
}

/**
 * Build manifest header
 */
function buildManifestHeader(data: MasterJobPdfData): any {
  const job = data.masterJob;

  const leftItems = [
    { label: 'MBL No', value: job?.mblNo || '' },
    { label: 'Job No', value: job?.jobNo || '' },
    { label: 'Vessel/Voyage', value: [job?.vesselName, job?.voyageNo].filter(Boolean).join(' / ') }
  ];

  const rightItems = [
    { label: 'POL', value: formatPort(job?.pol) },
    { label: 'POD', value: formatPort(job?.pod) },
    { label: 'ETD', value: formatDate(job?.polEtd) }
  ];

  return buildTwoColumnInfo(leftItems, rightItems, { labelWidth: 100 });
}

/**
 * Build manifest totals
 */
function buildManifestTotals(data: MasterJobPdfData): any {
  const houseJobs = data.houseJobs || [];

  const totalPackages = houseJobs.reduce((sum, h) => sum + (h.packages || 0), 0);
  const totalWeight = houseJobs.reduce((sum, h) => sum + (h.grossWeight || 0), 0);
  const totalVolume = houseJobs.reduce((sum, h) => sum + (h.volume || 0), 0);

  return {
    columns: [
      { text: `Total House Shipments: ${houseJobs.length}`, style: 'labelBold' },
      { text: `Total Packages: ${totalPackages}`, style: 'labelBold', alignment: 'center' },
      { text: `Total Weight: ${formatNumber(totalWeight, 2)} KG`, style: 'labelBold', alignment: 'center' },
      { text: `Total Volume: ${formatNumber(totalVolume, 3)} CBM`, style: 'labelBold', alignment: 'right' }
    ],
    margin: [0, 15, 0, 0]
  };
}

/**
 * Build job card info
 */
function buildJobCardInfo(data: MasterJobPdfData): any {
  const job = data.masterJob;

  const leftItems = [
    { label: 'Job No', value: job?.jobNo || '' },
    { label: 'MBL No', value: job?.mblNo || '' },
    { label: 'Carrier', value: job?.carrierName || '' }
  ];

  const rightItems = [
    { label: 'Job Date', value: formatDate(job?.jobDate) },
    { label: 'Freight Terms', value: job?.freightTerms || '' },
    { label: 'Inco Terms', value: job?.incoTerms || '' }
  ];

  return buildTwoColumnInfo(leftItems, rightItems, { labelWidth: 90 });
}

/**
 * Build job card parties section
 */
function buildJobCardParties(data: MasterJobPdfData): any {
  const job = data.masterJob;

  return {
    columns: [
      buildPartyInfo('Shipper', job?.shipper || {}, { width: '33%' }),
      buildPartyInfo('Consignee', job?.consignee || {}, { width: '33%' }),
      buildPartyInfo('Notify Party', job?.notifyParty || {}, { width: '34%' })
    ],
    margin: [0, 0, 0, 15]
  };
}

/**
 * Build shipment details table for job card
 */
function buildShipmentDetailsTable(data: MasterJobPdfData): any {
  const job = data.masterJob;

  const details = [
    ['Vessel/Voyage', [job?.vesselName, job?.voyageNo].filter(Boolean).join(' / ')],
    ['Port of Loading', formatPort(job?.pol)],
    ['Port of Discharge', formatPort(job?.pod)],
    ['Final Destination', formatPort(job?.fpd)],
    ['ETD', formatDate(job?.polEtd)],
    ['ETA', formatDate(job?.podEta)]
  ].filter(d => d[1]);

  return {
    table: {
      widths: [120, '*'],
      body: details.map(d => [
        { text: d[0], style: 'labelBold' },
        { text: d[1] }
      ])
    },
    layout: PDF_TABLE_LAYOUTS.noBorders,
    margin: [0, 0, 0, 15]
  };
}

/**
 * Build packing list header
 */
function buildPackingListHeader(data: MasterJobPdfData): any {
  const job = data.masterJob;

  return {
    columns: [
      {
        columns: [
          { text: 'Job No:', style: 'labelBold', width: 60 },
          { text: job?.jobNo || '', width: '*' }
        ]
      },
      {
        columns: [
          { text: 'MBL No:', style: 'labelBold', width: 60 },
          { text: job?.mblNo || '', width: '*' }
        ]
      },
      {
        columns: [
          { text: 'Date:', style: 'labelBold', width: 40 },
          { text: formatDate(job?.jobDate), width: '*' }
        ]
      }
    ],
    margin: [0, 0, 0, 15]
  };
}

/**
 * Build packing details table
 */
function buildPackingDetailsTable(data: MasterJobPdfData): any {
  const containers = data.containers || [];

  if (containers.length === 0) {
    return { text: 'No packing details available', style: 'muted' };
  }

  const headerRow = [
    { text: 'Container No', style: 'tableHeader' },
    { text: 'Seal No', style: 'tableHeader' },
    { text: 'Type', style: 'tableHeader' },
    { text: 'Packages', style: 'tableHeader', alignment: 'right' },
    { text: 'Gross Wt (KG)', style: 'tableHeader', alignment: 'right' },
    { text: 'Net Wt (KG)', style: 'tableHeader', alignment: 'right' },
    { text: 'Volume (CBM)', style: 'tableHeader', alignment: 'right' }
  ];

  const dataRows = containers.map(c => [
    { text: c.containerNo || '', style: 'tableCell' },
    { text: c.sealNo || '', style: 'tableCell' },
    { text: c.containerType || '', style: 'tableCell' },
    { text: formatNumber(c.packageQty, 0), style: 'tableCell', alignment: 'right' },
    { text: formatNumber(c.grossWeight, 2), style: 'tableCell', alignment: 'right' },
    { text: formatNumber(c.netWeight, 2), style: 'tableCell', alignment: 'right' },
    { text: formatNumber(c.volume, 3), style: 'tableCell', alignment: 'right' }
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ['*', 70, 50, 50, 70, 70, 70],
      body: [headerRow, ...dataRows]
    },
    layout: PDF_TABLE_LAYOUTS.bordered,
    margin: [0, 0, 0, 15]
  };
}

/**
 * Build packing totals
 */
function buildPackingTotals(data: MasterJobPdfData): any {
  const containers = data.containers || [];

  const totalPackages = containers.reduce((sum, c) => sum + (c.packageQty || 0), 0);
  const totalGrossWeight = containers.reduce((sum, c) => sum + (c.grossWeight || 0), 0);
  const totalNetWeight = containers.reduce((sum, c) => sum + (c.netWeight || 0), 0);
  const totalVolume = containers.reduce((sum, c) => sum + (c.volume || 0), 0);

  return {
    table: {
      widths: ['*', 70, 50, 50, 70, 70, 70],
      body: [[
        { text: 'TOTAL', style: 'tableFooter', colSpan: 3 },
        {},
        {},
        { text: formatNumber(totalPackages, 0), style: 'tableFooter', alignment: 'right' },
        { text: formatNumber(totalGrossWeight, 2), style: 'tableFooter', alignment: 'right' },
        { text: formatNumber(totalNetWeight, 2), style: 'tableFooter', alignment: 'right' },
        { text: formatNumber(totalVolume, 3), style: 'tableFooter', alignment: 'right' }
      ]]
    },
    layout: PDF_TABLE_LAYOUTS.bordered,
    margin: [0, 0, 0, 15]
  };
}

/**
 * Format port info for display
 */
function formatPort(port: { portName: string; portCode: string } | undefined): string {
  if (!port) return '';
  return port.portCode ? `${port.portName} (${port.portCode})` : port.portName;
}

/**
 * Transform API data to MasterJobPdfData format
 */
export function transformMasterJobApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  lookups?: {
    ports?: any[];
  }
): MasterJobPdfData {
  const job = apiData;

  const parseParty = (partyData: any): PartyInfo => ({
    name: partyData?.Name || partyData?.name || '',
    address: partyData?.Address || partyData?.address || '',
    city: partyData?.City || partyData?.city || '',
    country: partyData?.Country || partyData?.country || '',
    phone: partyData?.Phone || partyData?.phone || '',
    email: partyData?.Email || partyData?.email || ''
  });

  return {
    company: {
      companyName: company?.companyName || '',
      addressLine1: company?.addressLine1 || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || '',
      postalCode: company?.postal_code || '',
      phoneNumber: company?.phoneNumber || ''
    },
    branch: {
      branchName: branch?.branchName || '',
      addressLine1: branch?.addressLine1 || '',
      cityName: branch?.cityMaster?.cityName || '',
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster
    },
    userData: {
      userName: userData?.userName || '',
      email: userData?.email || ''
    },
    logo,
    masterJob: {
      jobNo: job.JobNo || job.MasterJobNo || '',
      mblNo: job.MBLNo || job.MAWBNo || '',
      jobDate: job.JobDate || job.CreatedDate,
      vesselName: job.VesselName || job.FlightName || '',
      voyageNo: job.VoyageNo || job.FlightNo || '',
      carrierName: job.CarrierName || '',
      pol: job.POL ? { portName: job.POL, portCode: '' } : undefined,
      pod: job.POD ? { portName: job.POD, portCode: '' } : undefined,
      fpd: job.FPD ? { portName: job.FPD, portCode: '' } : undefined,
      polEtd: job.POLETD || job.ETD,
      podEta: job.PODETA || job.ETA,
      shipper: parseParty(job.shipper || job.Shipper),
      consignee: parseParty(job.consignee || job.Consignee),
      notifyParty: parseParty(job.notifyParty || job.NotifyParty),
      agent: parseParty(job.agent || job.Agent),
      freightTerms: job.FreightTerms || '',
      incoTerms: job.IncoTerms || '',
      placeOfReceipt: job.PlaceOfReceipt || '',
      placeOfDelivery: job.PlaceOfDelivery || '',
      remarks: job.Remarks || '',
      marksAndNumbers: job.MarksAndNumbers || '',
      descriptionOfGoods: job.DescriptionOfGoods || job.GoodsDescription || ''
    },
    containers: (job.containers || job.masterJobContainer || []).map((c: any) => ({
      containerNo: c.ContainerNo || c.containerNo || '',
      containerType: c.ContainerType || c.containerType || '',
      sealNo: c.SealNo || c.sealNo || '',
      grossWeight: c.GrossWeight || c.grossWeight || 0,
      tareWeight: c.TareWeight || c.tareWeight || 0,
      netWeight: c.NetWeight || c.netWeight || 0,
      volume: c.Volume || c.volume || 0,
      packageQty: c.PackageQty || c.packageQty || c.NoOfPackage || 0
    })),
    houseJobs: (job.houseJobs || job.houseShipments || []).map((h: any) => ({
      hblNo: h.HBLNo || h.hblNo || '',
      shipperName: h.ShipperName || h.shipperName || '',
      consigneeName: h.ConsigneeName || h.consigneeName || '',
      packages: h.Packages || h.packages || h.NoOfPackage || 0,
      grossWeight: h.GrossWeight || h.grossWeight || 0,
      volume: h.Volume || h.volume || 0,
      description: h.Description || h.description || ''
    })),
    charges: (job.charges || []).map((c: any) => ({
      chargeName: c.ChargeName || c.ChargeDisplayName || '',
      unit: c.Unit || c.UOMCode || '',
      qty: c.Qty || 1,
      currency: c.Currency || c.CurrencyCode || '',
      rate: c.Rate || c.RevenueRate || 0,
      amount: c.Amount || c.RevenueAmount || 0
    })),
    fclLcl: job.FCLLCL || 'FCL',
    departmentName: job.DepartmentName || ''
  };
}
