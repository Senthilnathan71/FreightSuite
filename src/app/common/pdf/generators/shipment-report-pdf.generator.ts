import {
  ShipmentChargePdfRow,
  ShipmentPartyAmountRow,
  ShipmentProductPdfRow,
  ShipmentReportPdfData
} from '../interfaces/pdf-document.interfaces';
import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { getPdfStyles } from '../styles/pdf-styles';

export function generateShipmentReportDocument(data: ShipmentReportPdfData): any {
  const showContainerColumns = (data.selectedFclLcl || '').toUpperCase() === 'FCL';

  return {
    pageSize: data.config?.pageSize || 'A4',
    pageOrientation: 'landscape',
    pageMargins: [15, 108, 15, 36],
    header: (_currentPage: number, _pageCount: number, pageSize: any) => ({
      margin: [15, 14, 15, 0],
      stack: [
        buildHeader(data),
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: pageSize.width - 30,
              y2: 0,
              lineWidth: 1,
              lineColor: '#000'
            }
          ],
          margin: [0, 2, 0, 2]
        },
        buildTitle(data)
      ]
    }),
    background: (_: number, pageSize: any) => ({
      canvas: [
        {
          type: 'rect',
          x: 14,
          y: 14,
          w: pageSize.width - 28,
          h: pageSize.height - 28,
          lineWidth: 1,
          lineColor: '#000'
        }
      ]
    }),
    content: [
      buildPartySection(data),
      buildShipmentInfoSection(data),
      buildProductsTable(data, showContainerColumns),
      buildChargesTable(data),
      buildSummaryTables(data)
    ],
    footer: (currentPage: number, pageCount: number) =>
      buildShipmentFooter(data, currentPage, pageCount),
    styles: getShipmentStyles(),
    defaultStyle: {
      fontSize: 10,
      color: '#000'
    }
  };
}

function buildHeader(data: ShipmentReportPdfData): any {
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
  ]
    .filter(Boolean)
    .join(', ');

  const companyDetails = {
    stack: [
      { text: (company?.companyName || '').toUpperCase(), bold: true, fontSize: 14, alignment: companyAlignment },
      { text: branch?.branchName || '', bold: true, fontSize: 11, alignment: companyAlignment, margin: [0, 1, 0, 0] },
      { text: detailLine1, fontSize: 9, alignment: companyAlignment, margin: [0, 1, 0, 0] },
      { text: detailLine2, fontSize: 9, alignment: companyAlignment, margin: [0, 1, 0, 0] }
    ],
    margin: [0, 0, 0, 0]
  };

  return {
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

function buildTitle(data: ShipmentReportPdfData): any {
  return {
    text: data.reportTitle,
    bold: true,
    alignment: 'center',
    fontSize: 10,
    margin: [0, 2, 0, 4]
  };
}

function buildPartySection(data: ShipmentReportPdfData): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [
        [
          buildPartyCell('Customer', data.parties.customerName, data.parties.customerAddress),
          buildPartyCell('Shipper', data.parties.shipperName, data.parties.shipperAddress)
        ],
        [
          buildPartyCell('Consignee', data.parties.consigneeName, data.parties.consigneeAddress),
          buildPartyCell('Notify', data.parties.notifyName, data.parties.notifyAddress)
        ]
      ]
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingTop: () => 5,
      paddingBottom: () => 5,
      paddingLeft: () => 6,
      paddingRight: () => 6
    },
    margin: [5, 0, 5, 8]
  };
}

function buildPartyCell(label: string, name?: string, address?: string): any {
  return {
    stack: [
      { text: label, style: 'sectionLabel', margin: [0, 0, 0, 4] },
      { text: name || '', style: 'valueText', margin: [10, 0, 0, 2] },
      { text: address || '', style: 'valueText', margin: [10, 0, 0, 0] }
    ],
    minHeight: 52
  };
}

function buildShipmentInfoSection(data: ShipmentReportPdfData): any {
  const leftItems: Array<[string, string]> = [
    ['Shipment No.', data.shipmentInfo.shipmentNo],
    ['MBL No.', data.shipmentInfo.mblNo],
    ['Place of Receipt', data.shipmentInfo.placeOfReceipt],
    ['Port of Loading', data.shipmentInfo.portOfLoading],
    ['Final Destination', data.shipmentInfo.finalDestination],
    ['ETD', formatDate(data.shipmentInfo.etd)],
    ['Carrier', data.shipmentInfo.carrier],
    ['Shipment Terms', data.shipmentInfo.shipmentTerms]
  ].map(([label, value]) => [label, value || '']);

  const rightItems: Array<[string, string]> = [
    ['Job No.', data.shipmentInfo.jobNo],
    ['HBL No.', data.shipmentInfo.hblNo],
    ['Port of Receipt', data.shipmentInfo.portOfReceipt],
    ['Port of Discharge', data.shipmentInfo.portOfDischarge],
    ['Place of Delivery', data.shipmentInfo.placeOfDelivery],
    ['ETA', formatDate(data.shipmentInfo.eta)],
    ['Vessel/Voyage', joinNonEmpty([data.shipmentInfo.vesselName, data.shipmentInfo.voyageNo], ' / ')],
    ['PP/CC', data.shipmentInfo.freightTerms]
  ].map(([label, value]) => [label, value || '']);

  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: leftItems.map(([label, value]) => buildKeyValueRow(label, value)), border: [true, true, false, true] },
        { stack: rightItems.map(([label, value]) => buildKeyValueRow(label, value)), border: [false, true, true, true] }
      ]]
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingTop: () => 4,
      paddingBottom: () => 4,
      paddingLeft: () => 6,
      paddingRight: () => 6
    },
    margin: [5, 0, 5, 8]
  };
}

function buildKeyValueRow(label: string, value?: string): any {
  return {
    columns: [
      { text: label, width: 105, style: 'sectionLabel' },
      { text: ':', width: 8 },
      { text: value || '', width: '*', style: 'valueText' }
    ],
    margin: [0, 0, 0, 4]
  };
}

function buildProductsTable(data: ShipmentReportPdfData, showContainerColumns: boolean): any {
  const widths = showContainerColumns ? [60, 60, '*', 42, 48, 48, 48] : ['*', 50, 58, 58, 58];
  const headerRow = showContainerColumns
    ? [
        { text: 'Container No.', style: 'tableHeader' },
        { text: 'Type', style: 'tableHeader' },
        { text: 'Commodity', style: 'tableHeader' },
        { text: 'No. of Pkg', style: 'tableHeader' },
        { text: 'Gross Wt.', style: 'tableHeader' },
        { text: 'Net Wt.', style: 'tableHeader' },
        { text: 'Volume', style: 'tableHeader' }
      ]
    : [
        { text: 'Commodity', style: 'tableHeader' },
        { text: 'No. of Pkg', style: 'tableHeader' },
        { text: 'Gross Wt.', style: 'tableHeader' },
        { text: 'Net Wt.', style: 'tableHeader' },
        { text: 'Volume', style: 'tableHeader' }
      ];

  const rows = data.products.map((item) => showContainerColumns
    ? [
        buildTextCell(item.containerNo),
        buildTextCell(item.containerType),
        buildTextCell(item.commodity),
        buildNumberCell(item.noOfPackage, 0),
        buildNumberCell(item.grossWeight, 3),
        buildNumberCell(item.netWeight, 3),
        buildNumberCell(item.volume, 3)
      ]
    : [
        buildTextCell(item.commodity),
        buildNumberCell(item.noOfPackage, 0),
        buildNumberCell(item.grossWeight, 3),
        buildNumberCell(item.netWeight, 3),
        buildNumberCell(item.volume, 3)
      ]);

  const footerRow = showContainerColumns
    ? [
        { text: 'Total', colSpan: 3, style: 'tableCellBold', alignment: 'right' },
        {},
        {},
        buildNumberCell(data.productTotals.totalPackages, 0, true),
        buildNumberCell(data.productTotals.totalGrossWeight, 3, true),
        buildNumberCell(data.productTotals.totalNetWeight, 3, true),
        buildNumberCell(data.productTotals.totalVolume, 3, true)
      ]
    : [
        { text: 'Total', style: 'tableCellBold', alignment: 'right' },
        buildNumberCell(data.productTotals.totalPackages, 0, true),
        buildNumberCell(data.productTotals.totalGrossWeight, 3, true),
        buildNumberCell(data.productTotals.totalNetWeight, 3, true),
        buildNumberCell(data.productTotals.totalVolume, 3, true)
      ];

  return {
    table: {
      headerRows: 1,
      keepWithHeaderRows: 1,
      dontBreakRows: true,
      widths,
      body: [headerRow, ...rows, footerRow]
    },
    layout: borderedLayout(),
    margin: [5, 0, 5, 8]
  };
}

function buildChargesTable(data: ShipmentReportPdfData): any {
  return {
    table: {
      headerRows: 2,
      keepWithHeaderRows: 2,
      dontBreakRows: true,
      widths: ['*', 60, 60, 55, 60, 60, 55],
      body: [
        [
          { text: 'Charge', style: 'tableHeader', rowSpan: 2 },
          { text: 'Provisional', style: 'tableHeader', colSpan: 3 },
          {},
          {},
          { text: 'Actual', style: 'tableHeader', colSpan: 3 },
          {},
          {},
        ],
        [
          {},
          { text: 'Local Rev', style: 'tableHeader' },
          { text: 'Local Cost', style: 'tableHeader' },
          { text: 'Local GP', style: 'tableHeader' },
          { text: 'Local Rev', style: 'tableHeader' },
          { text: 'Local Cost', style: 'tableHeader' },
          { text: 'Local GP', style: 'tableHeader' }
        ],
        ...data.charges.map((item) => buildChargeRow(item)),
        [
          { text: 'Total', style: 'tableCellBold', alignment: 'right' },
          buildNumberCell(data.chargeTotals.totalLocalRevenue, 2, true),
          buildNumberCell(data.chargeTotals.totalLocalExpense, 2, true),
          buildNumberCell(data.chargeTotals.totalLocalGP, 2, true),
          buildNumberCell(data.chargeTotals.totalActualLocalRevenue, 2, true),
          buildNumberCell(data.chargeTotals.totalActualLocalExpense, 2, true),
          buildNumberCell(data.chargeTotals.totalActualLocalGP, 2, true)
        ]
      ]
    },
    layout: borderedLayout(),
    margin: [5, 0, 5, 8]
  };
}

function buildChargeRow(item: ShipmentChargePdfRow): any[] {
  return [
    buildTextCell(item.chargeName),
    buildNumberCell(item.localRevenue, 2),
    buildNumberCell(item.localExpense, 2),
    buildNumberCell(item.localGP, 2),
    buildNumberCell(item.actualLocalRevenue, 2),
    buildNumberCell(item.actualLocalExpense, 2),
    buildNumberCell(item.actualLocalGP, 2)
  ];
}

function buildSummaryTables(data: ShipmentReportPdfData): any {
  return {
    columns: [
      buildPartyAmountTable('Revenue', 'Sales Organization(Local)', data.revenueSummary, data.summaryTotals.totalRevenue),
      buildPartyAmountTable('Expense', 'Cost Organization(Local)', data.expenseSummary, data.summaryTotals.totalExpense)
    ],
    columnGap: 8,
    margin: [5, 0, 5, 8]
  };
}

function buildPartyAmountTable(
  title: string,
  label: string,
  items: ShipmentPartyAmountRow[],
  total: number
): any {
  return {
    width: '50%',
    stack: [
      { text: title, style: 'pageTitle', margin: [0, 0, 0, 4] },
      {
        table: {
          headerRows: 1,
          keepWithHeaderRows: 1,
          dontBreakRows: true,
          widths: ['*', 70],
          body: [
            [
              { text: label, style: 'tableHeader' },
              { text: 'Amt', style: 'tableHeader' }
            ],
            ...items.map((item) => [
              buildTextCell(item.customerName, true),
              buildNumberCell(item.amount, 2, true)
            ]),
            [
              { text: 'Total', style: 'tableCellBold', alignment: 'right' },
              buildNumberCell(total, 2, true)
            ]
          ]
        },
        layout: borderedLayout()
      }
    ],
    unbreakable: true
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
    text: formatNumberWithCommas(value || 0, decimals),
    style: bold ? 'tableCellBold' : 'tableCell',
    alignment: 'right'
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

function getShipmentStyles(): any {
  return {
    ...getPdfStyles(),
    pageTitle: { fontSize: 11, bold: true, alignment: 'center' },
    sectionLabel: { fontSize: 8, bold: true },
    valueText: { fontSize: 8 },
    tableHeader: { fontSize: 8, bold: true, alignment: 'center' },
    tableCell: { fontSize: 8 },
    tableCellBold: { fontSize: 8, bold: true }
  };
}

function buildShipmentFooter(
  data: ShipmentReportPdfData,
  currentPage?: number,
  pageCount?: number
): any {
  return {
    margin: [24, 0, 24, 4],
    columns: [
      {
        text: `Printed By : ${data.userData?.userName || ''}`,
        alignment: 'left',
        width: 120,
        fontSize: 7,
        noWrap: true
      },
      {
        text: 'This document is computer-generated and does not require a signature.',
        alignment: 'center',
        width: '*',
        fontSize: 7,
        noWrap: true
      },
      {
        text: `Printed On : ${formatDate(new Date())}`,
        alignment: 'right',
        width: 120,
        fontSize: 7,
        noWrap: true
      },
      {
        text: currentPage && pageCount ? `Page ${currentPage} of ${pageCount}` : '',
        alignment: 'right',
        width: 60,
        fontSize: 7,
        noWrap: true
      }
    ]
  };
}

export function transformShipmentReportApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    chargeList?: any[];
    profitSummary?: any[];
    customerWiseSummary?: { revenue?: any[]; cost?: any[] };
    containerTypeList?: any[];
    selectedFCLLCL?: string;
    portList?: any[];
  }
): ShipmentReportPdfData {
  const costRevenueCharges = apiData?.costRevenueCharges || [];
  const products = apiData?.Products || [];
  const chargeList = options?.chargeList || [];
  const selectedFclLcl = options?.selectedFCLLCL || '';

  const getPortName = (portCode?: string): string => {
    if (!portCode) return '';
    const port = (options?.portList || []).find((item: any) => item.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  };

  const getContainerName = (containerTypeMasterSid?: number): string => {
    if (!containerTypeMasterSid) return '';
    const match = (options?.containerTypeList || []).find(
      (item: any) => item.ContainerTypeMasterSid === containerTypeMasterSid
    );
    return match?.ContainerName || '';
  };

  const getChargeName = (chargeMasterSid?: number): string => {
    if (!chargeMasterSid) return 'N/A';
    const charge = chargeList.find(
      (item: any) => item.ChargeMasterSid === chargeMasterSid || item.ChargeMasterSID === chargeMasterSid
    );
    return charge ? (charge.chargeName || charge.chargeCode || 'N/A') : 'N/A';
  };

  const chargeRows: ShipmentChargePdfRow[] = costRevenueCharges.map((item: any) => {
    const voucherActuals = getActualAmountsFromVoucherDetails(item);
    const pCurrRevenue = Number(item.RevenueAmount || 0);
    const pCurrExpense = Number(item.CostAmount || 0);
    const localRevenue = Number(item.RevenueLocalAmount || 0);
    const localExpense = Number(item.CostLocalAmount || 0);
    const hasRevenueVoucher = !!(item?.RevenueVoucherHeaderSid || item?.revenueVoucherHeader?.VoucherHeaderSid);
    const hasCostVoucher = !!(item?.CostVoucherHeaderSid || item?.costVoucherHeader?.VoucherHeaderSid);
    const pickActual = (...values: any[]): number | null => {
      for (const value of values) {
        if (value !== undefined && value !== null && value !== '') {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            return parsed;
          }
        }
      }
      return null;
    };

    const actualPCurrRevenue = pickActual(
      item?.ActualRevenueAmount,
      item?.RevenueActualAmount,
      item?.ActualRevenueRate
    ) ?? (hasRevenueVoucher ? pCurrRevenue : 0);
    const actualPCurrExpense = pickActual(
      item?.ActualCostAmount,
      item?.CostActualAmount,
      item?.ActualCostRate
    ) ?? (hasCostVoucher ? pCurrExpense : 0);
    const actualLocalRevenue = voucherActuals.revenue !== 0
      ? voucherActuals.revenue
      : (pickActual(
        item?.ActualRevenueLocalAmount,
        item?.RevenueActualLocalAmount
      ) ?? (hasRevenueVoucher ? localRevenue : 0));
    const actualLocalExpense = voucherActuals.cost !== 0
      ? voucherActuals.cost
      : (pickActual(
        item?.ActualCostLocalAmount,
        item?.CostActualLocalAmount
      ) ?? (hasCostVoucher ? localExpense : 0));

    return {
      chargeName: getChargeName(item.ChargeMasterSid),
      pCurrRevenue,
      pCurrExpense,
      pCurrGP: pCurrRevenue - pCurrExpense,
      localRevenue,
      localExpense,
      localGP: localRevenue - localExpense,
      actualPCurrRevenue,
      actualPCurrExpense,
      actualPCurrGP: actualPCurrRevenue - actualPCurrExpense,
      actualLocalRevenue,
      actualLocalExpense,
      actualLocalGP: actualLocalRevenue - actualLocalExpense
    };
  });

  const chargeTotals = chargeRows.reduce(
    (acc, item) => {
      acc.totalPCurrRevenue += Number(item.pCurrRevenue || 0);
      acc.totalPCurrExpense += Number(item.pCurrExpense || 0);
      acc.totalPCurrGP += Number(item.pCurrGP || 0);
      acc.totalLocalRevenue += Number(item.localRevenue || 0);
      acc.totalLocalExpense += Number(item.localExpense || 0);
      acc.totalLocalGP += Number(item.localGP || 0);
      acc.totalActualPCurrRevenue += Number(item.actualPCurrRevenue || 0);
      acc.totalActualPCurrExpense += Number(item.actualPCurrExpense || 0);
      acc.totalActualPCurrGP += Number(item.actualPCurrGP || 0);
      acc.totalActualLocalRevenue += Number(item.actualLocalRevenue || 0);
      acc.totalActualLocalExpense += Number(item.actualLocalExpense || 0);
      acc.totalActualLocalGP += Number(item.actualLocalGP || 0);
      return acc;
    },
    {
      totalPCurrRevenue: 0,
      totalPCurrExpense: 0,
      totalPCurrGP: 0,
      totalLocalRevenue: 0,
      totalLocalExpense: 0,
      totalLocalGP: 0,
      totalActualPCurrRevenue: 0,
      totalActualPCurrExpense: 0,
      totalActualPCurrGP: 0,
      totalActualLocalRevenue: 0,
      totalActualLocalExpense: 0,
      totalActualLocalGP: 0
    }
  );

  const productRows: ShipmentProductPdfRow[] = products.map((item: any) => ({
    containerNo: item?.ContainerNo || '',
    containerType: getContainerName(item?.masterJobContainer?.ContainerType),
    commodity: item?.ProductName || '',
    noOfPackage: Number(item?.ExternlQty || 0),
    grossWeight: Number(item?.GrossWeight || 0),
    netWeight: Number(item?.NetWeight || 0),
    volume: Number(item?.Volume || 0)
  }));

  const productTotals = productRows.reduce(
    (acc, item) => {
      acc.totalPackages += Number(item.noOfPackage || 0);
      acc.totalGrossWeight += Number(item.grossWeight || 0);
      acc.totalNetWeight += Number(item.netWeight || 0);
      acc.totalVolume += Number(item.volume || 0);
      return acc;
    },
    {
      totalPackages: 0,
      totalGrossWeight: 0,
      totalNetWeight: 0,
      totalVolume: 0
    }
  );

  const revenueSummary: ShipmentPartyAmountRow[] = (options?.customerWiseSummary?.revenue || []).map((item: any) => ({
    customerName: item.CustomerName || '',
    amount: Number(item.Amount || 0)
  }));

  const expenseSummary: ShipmentPartyAmountRow[] = (options?.customerWiseSummary?.cost || []).map((item: any) => ({
    customerName: item.CustomerName || '',
    amount: Number(item.Amount || 0)
  }));

  return {
    reportTitle: `House Profit and Loss / Shipment No - ${apiData?.ShipmentNo || ''}`,
    shipmentNo: apiData?.ShipmentNo || '',
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
    selectedFclLcl,
    parties: {
      customerName: apiData?.CustomerName || '',
      customerAddress: apiData?.CustomerAddress || '',
      shipperName: apiData?.ShipperName || '',
      shipperAddress: apiData?.ShipperAddress || '',
      consigneeName: apiData?.ConsigneeName || '',
      consigneeAddress: apiData?.ConsigneeAddress || '',
      notifyName: apiData?.Notify || '',
      notifyAddress: apiData?.NotifyAddress || ''
    },
    shipmentInfo: {
      shipmentNo: apiData?.ShipmentNo || '',
      mblNo: apiData?.masterJob?.MBLNo || apiData?.MBLNo || '',
      hblNo: apiData?.HBLNo || '',
      jobNo: apiData?.masterJob?.MasterJobNumber || '',
      placeOfReceipt: getPortName(apiData?.POO),
      portOfLoading: getPortName(apiData?.POL),
      portOfReceipt: getPortName(apiData?.POL),
      portOfDischarge: getPortName(apiData?.POD),
      finalDestination: getPortName(apiData?.FPD),
      placeOfDelivery: getPortName(apiData?.FPD),
      etd: apiData?.ETD,
      eta: apiData?.ETA,
      carrier: apiData?.CarrierName || '',
      shipmentTerms: apiData?.Cargo?.[0]?.ShipmentTerms || '',
      vesselName: apiData?.VesselName || '',
      voyageNo: apiData?.VoyageNo || '',
      freightTerms: apiData?.FreightTerms || ''
    },
    products: productRows,
    productTotals,
    charges: chargeRows,
    chargeTotals,
    revenueSummary,
    expenseSummary,
    summaryTotals: {
      totalRevenue: revenueSummary.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      totalExpense: expenseSummary.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    }
  };
}

function getActualAmountsFromVoucherDetails(item: any): { revenue: number; cost: number } {
  const voucherDetails =
    item?.voucherDetail || item?.VoucherDetail || item?.VoucherDetails;
  if (!Array.isArray(voucherDetails)) {
    return { revenue: 0, cost: 0 };
  }

  return voucherDetails.reduce(
    (totals: { revenue: number; cost: number }, detail: any) => {
      const costRevenue = (detail?.CostRevenue || detail?.costRevenue || '').toString().toUpperCase();
      const drCr = (detail?.DrCr || detail?.drCr || '').toString().toUpperCase();
      const amount = parseFloat(detail?.LocalAmount || detail?.localAmount || 0) || 0;

      if (costRevenue === 'REVENUE') {
        totals.revenue += drCr === 'C' ? amount : -amount;
      } else if (costRevenue === 'COST') {
        totals.cost += drCr === 'D' ? amount : -amount;
      }

      return totals;
    },
    { revenue: 0, cost: 0 }
  );
}
