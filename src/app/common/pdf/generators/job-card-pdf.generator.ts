import {
  JobCardChargePdfRow,
  JobCardPartyAmountRow,
  JobCardPdfData,
  JobCardProductPdfRow,
  JobCardProfitPdfRow
} from '../interfaces/pdf-document.interfaces';
import { formatDate, formatNumberWithCommas, joinNonEmpty } from '../helpers/pdf-formatters';
import { getPdfStyles } from '../styles/pdf-styles';

export function generateJobCardDocument(data: JobCardPdfData): any {
  const isSea = (data.selectedDepartmentType || '').toUpperCase() === 'SEA';

  return {
    pageSize: data.config?.pageSize || 'A4',
    pageOrientation: 'landscape',
    pageMargins: [15, 108, 15, 46],
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
    header: () => ({
      margin: [15, 14, 15, 0],
      stack: [
        buildHeader(data),
        buildTitle(data)
      ]
    }),
    content: [
      buildPartySection(data),
      buildJobInfoSection(data, isSea),
      buildProductsTable(data, isSea),
      buildProfitSummaryTable(data),
      buildCostRevenueTable(data),
      buildRevenueExpenseSection(data),
      buildInternalRemarks(data)
    ],
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    styles: getJobCardStyles(),
    defaultStyle: {
      fontSize: 10,
      color: '#000'
    }
  };
}

function buildHeader(data: JobCardPdfData): any {
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

function buildTitle(data: JobCardPdfData): any {
  return {
    table: {
      widths: ['*'],
      body: [[{ text: data.reportTitle, bold: true, alignment: 'center', fontSize: 10, margin: [0, 4, 0, 4] }]]
    },
    layout: {
      hLineWidth: (i: number) => (i === 0 ? 1 : 0),
      vLineWidth: () => 0,
      hLineColor: () => '#000'
    },
    margin: [0, 0, 0, 6]
  };
}

function buildPartySection(data: JobCardPdfData): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [
        [
          buildPartyCell('Client', data.parties.clientName, data.parties.clientAddress),
          buildPartyCell('Shipper', data.parties.shipperName, data.parties.shipperAddress)
        ],
        [
          buildPartyCell('Consignee', data.parties.consigneeName, data.parties.consigneeAddress),
          buildPartyCell('Forwarder', data.parties.forwarderName, data.parties.forwarderAddress)
        ]
      ]
    },
    layout: boxedLayout(5, 6),
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

function buildJobInfoSection(data: JobCardPdfData, isSea: boolean): any {
  const leftItems: Array<[string, string]> = [
    ['Job No.', data.jobInfo.jobNo || ''],
    [isSea ? 'HBL No.' : 'HAWB No.', data.jobInfo.houseNo || ''],
    ['POL', data.jobInfo.pol || ''],
    ['POD', data.jobInfo.pod || ''],
    ['FPD', data.jobInfo.fpd || ''],
    ...(isSea ? [['Service Type', data.jobInfo.serviceType || ''] as [string, string]] : []),
    ['Sales Person', data.jobInfo.salesPerson || '']
  ];

  const rightItems: Array<[string, string]> = [
    [isSea ? 'MBL No.' : 'MAWB No.', data.jobInfo.masterNo || ''],
    ['Place of Receipt', data.jobInfo.placeOfReceipt || ''],
    ['Place of Delivery', data.jobInfo.placeOfDelivery || ''],
    ['ETA', formatDate(data.jobInfo.eta)],
    ['ETD', formatDate(data.jobInfo.etd)],
    [isSea ? 'Vessel / Voy.' : 'Flight Name / No.', data.jobInfo.vesselOrFlight || ''],
    ['Carrier', data.jobInfo.carrier || ''],
    ['PP/CC', data.jobInfo.freightTerms || '']
  ];

  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        { stack: leftItems.map(([label, value]) => buildKeyValueRow(label, value)), border: [true, true, false, true] },
        { stack: rightItems.map(([label, value]) => buildKeyValueRow(label, value)), border: [false, true, true, true] }
      ]]
    },
    layout: boxedLayout(4, 6),
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
    margin: [0, 0, 0, 3]
  };
}

function buildProductsTable(data: JobCardPdfData, isSea: boolean): any {
  const header = isSea
    ? [
        'Commodity', 'No. of Container', 'Type', 'No. of Pkg', 'Gross Weight', 'Volume', 'Net Weight'
      ]
    : [
        'Commodity', 'Length', 'Width', 'Height', 'Volumetric', 'No. of Pkg', 'Gross Weight', 'Volume', 'Net Weight'
      ];

const widths = isSea
  ? ['*', 62, 60, 54, 52, 50, 50]
  : ['*', 38, 38, 38, 50, 50, 54, 50, 54];

  const rows = data.products.map((item) => isSea
    ? [
        buildTextCell(item.commodity),
        buildTextCell(item.containerNo),
        buildTextCell(item.containerType),
        buildNumberCell(item.noOfPackage, 0),
        buildNumberCell(item.grossWeight, 3),
        buildNumberCell(item.volume, 3),
        buildNumberCell(item.netWeight, 3)
      ]
    : [
        buildTextCell(item.commodity),
        buildNumberCell(item.length, 3),
        buildNumberCell(item.width, 3),
        buildNumberCell(item.height, 3),
        buildNumberCell(item.volumetric, 3),
        buildNumberCell(item.noOfPackage, 0),
        buildNumberCell(item.grossWeight, 3),
        buildNumberCell(item.volume, 3),
        buildNumberCell(item.netWeight, 3)
      ]);

  const totalRow = isSea
    ? [
        { text: 'TOTAL', colSpan: 3, style: 'tableCellBold', alignment: 'right' }, {}, {},
        buildNumberCell(data.productTotals.totalPackages, 0, true),
        buildNumberCell(data.productTotals.totalGrossWeight, 3, true),
        buildNumberCell(data.productTotals.totalVolume, 3, true),
        buildNumberCell(data.productTotals.totalNetWeight, 3, true)
      ]
    : [
        { text: 'TOTAL', style: 'tableCellBold', alignment: 'right' },
        buildNumberCell(data.productTotals.totalLength, 3, true),
        buildNumberCell(data.productTotals.totalWidth, 3, true),
        buildNumberCell(data.productTotals.totalHeight, 3, true),
        buildNumberCell(data.productTotals.totalVolumetric, 3, true),
        buildNumberCell(data.productTotals.totalPackages, 0, true),
        buildNumberCell(data.productTotals.totalGrossWeight, 3, true),
        buildNumberCell(data.productTotals.totalVolume, 3, true),
        buildNumberCell(data.productTotals.totalNetWeight, 3, true)
      ];

  return {
    table: {
      headerRows: 1,
      widths,
      body: [
        header.map((text) => ({ text, style: 'tableHeader' })),
        ...rows,
        totalRow
      ]
    },
    layout: borderedLayout(),
    margin: [5, 0, 5, 8]
  };
}

function buildProfitSummaryTable(data: JobCardPdfData): any {
  return {
    table: {
      headerRows: 1,
      widths: ['*', 70, 70, 70],
      body: [
        [
          { text: 'Charge', style: 'tableHeader' },
          { text: 'Sales', style: 'tableHeader' },
          { text: 'Cost', style: 'tableHeader' },
          { text: 'GP', style: 'tableHeader' }
        ],
        ...data.profitSummary.map((item) => buildProfitRow(item)),
        [
          { text: 'TOTAL', style: 'tableCellBold', alignment: 'right' },
          buildNumberCell(data.profitTotals.totalSales, 2, true),
          buildNumberCell(data.profitTotals.totalCost, 2, true),
          buildNumberCell(data.profitTotals.profit, 2, true)
        ]
      ]
    },
    layout: borderedLayout(),
    margin: [5, 0, 5, 8]
  };
}

function buildProfitRow(item: JobCardProfitPdfRow): any[] {
  return [
    buildTextCell(item.chargeName),
    buildNumberCell(item.totalSales, 2),
    buildNumberCell(item.totalCost, 2),
    buildNumberCell(item.profit, 2)
  ];
}

function buildCostRevenueTable(data: JobCardPdfData): any {
  return {
    table: {
      headerRows: 2,
      keepWithHeaderRows: 2,
      dontBreakRows: true,
      widths: ['*', 26, 30, 36, 40, 48, 52, 34, 40, 38, 52, 52],
      body: [
        [
          { text: 'Charge', style: 'tableHeader', rowSpan: 2 },
          { text: 'Unit', style: 'tableHeader', rowSpan: 2 },
          { text: 'Revenue', style: 'tableHeader', colSpan: 5 },
          {},
          {},
          {},
          {},
          { text: 'Cost', style: 'tableHeader', colSpan: 5 },
          {},
          {},
          {},
          {}
        ],
        [
          {},
          {},
          { text: 'Curr', style: 'tableHeader' },
          { text: 'Ex.Rate', style: 'tableHeader' },
          { text: 'Per Unit', style: 'tableHeader' },
          { text: 'Local Amt.', style: 'tableHeader' },
          { text: 'Act Local Amt.', style: 'tableHeader' },
          { text: 'Curr', style: 'tableHeader' },
          { text: 'Ex Rate', style: 'tableHeader' },
          { text: 'Per Unit', style: 'tableHeader' },
          { text: 'Local Amt.', style: 'tableHeader' },
          { text: 'Act Local Amt.', style: 'tableHeader' }
        ],
        ...data.costRevenueCharges.map((item) => buildChargeDetailRow(item))
      ]
    },
    layout: borderedLayout(),
    margin: [5, 0, 5, 8]
  };
}

function buildChargeDetailRow(item: JobCardChargePdfRow): any[] {
  return [
    buildTextCell(item.chargeName),
    buildTextCell(item.unit),
    buildTextCell(item.revenueCurrency),
    buildNumberCell(item.revenueExchangeRate, 3),
    buildNumberCell(item.revenueRate, 2),
    buildNumberCell(item.revenueLocalAmount, 2),
    buildNumberCell(item.actualRevenueLocalAmount, 2),
    buildTextCell(item.costCurrency),
    buildNumberCell(item.costExchangeRate, 3),
    buildNumberCell(item.costRate, 2),
    buildNumberCell(item.costLocalAmount, 2),
    buildNumberCell(item.actualCostLocalAmount, 2)
  ];
}

function buildRevenueExpenseSection(data: JobCardPdfData): any {
  return {
    columns: [
      buildPartyAmountTable('Revenue', 'Sales Party', data.revenueByParty),
      buildPartyAmountTable('Expense', 'Cost Party', data.expenseByParty)
    ],
    columnGap: 8,
    margin: [5, 0, 5, 8]
  };
}

function buildPartyAmountTable(title: string, label: string, items: JobCardPartyAmountRow[]): any {
  return {
    width: '50%',
    stack: [
      { text: title, style: 'pageTitle', margin: [0, 0, 0, 4], decoration: 'underline' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 70],
          body: [
            [
              { text: label, style: 'tableHeader' },
              { text: 'Amount', style: 'tableHeader' }
            ],
            ...items.map((item) => [
              buildTextCell(item.party, true),
              buildNumberCell(item.amount, 2, true)
            ])
          ]
        },
        layout: borderedLayout()
      }
    ]
  };
}

function buildInternalRemarks(data: JobCardPdfData): any {
  return {
    columns: [
      { text: 'Internal Remarks', style: 'sectionLabel', width: 110 },
      { text: ':', width: 8 },
      { text: data.internalRemarks || '', width: '*' }
    ],
    margin: [5, 4, 5, 0]
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

function getJobCardStyles(): any {
  return {
    ...getPdfStyles(),
    pageTitle: { fontSize: 10, bold: true, alignment: 'center' },
    sectionLabel: { fontSize: 8, bold: true },
    valueText: { fontSize: 8 },
    tableHeader: { fontSize: 8, bold: true, alignment: 'center' },
    tableCell: { fontSize: 8 },
    tableCellBold: { fontSize: 8, bold: true }
  };
}

function buildFooter(data: JobCardPdfData, currentPage: number, pageCount: number): any {
  return {
    margin: [24, 0, 24, 6],
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, alignment: 'left', width: '30%', fontSize: 7, noWrap: true },
      {
        text: 'This document is computer-generated and does not require a signature.',
        alignment: 'center',
        width: '40%',
        fontSize: 7,
        noWrap: true
      },
      {
        text: `Printed On : ${formatDate(new Date())}  Page: ${currentPage} of ${pageCount}`,
        alignment: 'right',
        width: '30%',
        fontSize: 7,
        noWrap: true
      }
    ]
  };
}

export function transformJobCardApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    containerTypeList?: any[];
    currencyList?: any[];
    chargeList?: any[];
    profitSummary?: any[];
    salesmenList?: any[];
    uomList?: any[];
    portList?: any[];
    selectedDepartmentType?: string;
  }
): JobCardPdfData {
  const isSea = (options?.selectedDepartmentType || '').toUpperCase() === 'SEA';
  const products = apiData?.Products || [];
  const charges = apiData?.costRevenueCharges || [];
  const chargeList = options?.chargeList || [];

  const getPortName = (portCode?: string): string => {
    if (!portCode) return '';
    const port = (options?.portList || []).find((item: any) => item.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  };

  const getContainerTypeName = (containerTypeMasterSid?: number): string => {
    if (!containerTypeMasterSid) return '';
    const match = (options?.containerTypeList || []).find((item: any) => item.ContainerTypeMasterSid === containerTypeMasterSid);
    return match?.ContainerName || match?.ContainerType || match?.ContainerCode || '';
  };

  const getChargeName = (chargeMasterSid?: number): string => {
    if (!chargeMasterSid) return '';
    const match = chargeList.find((item: any) => item.ChargeMasterSid === chargeMasterSid);
    return match?.chargeName || match?.ChargeName || '';
  };

  const getCurrencyName = (currencyMasterSid?: number): string => {
    if (!currencyMasterSid) return '';
    const match = (options?.currencyList || []).find((item: any) => item.CurrencyMasterSid === currencyMasterSid);
    return match?.currencyCode || match?.CurrencyCode || '';
  };

  const getUnitCode = (uomSid?: number): string => {
    if (!uomSid) return '';
    const match = (options?.uomList || []).find((item: any) => item.UOMMasterSid === uomSid);
    return match?.UOMCode || '';
  };

  const getSalespersonName = (userMasterSid?: number): string => {
    const salesmen = options?.salesmenList || [];
    return salesmen.find((item: any) => item.UserMasterSid === userMasterSid)?.userName || '';
  };

  const computedProfitSummary: JobCardProfitPdfRow[] = (options?.profitSummary?.length ? options.profitSummary : buildProfitSummary(charges, chargeList)).map((item: any) => ({
    chargeName: item.chargeName || '',
    totalSales: Number(item.totalSales || 0),
    totalCost: Number(item.totalCost || 0),
    profit: Number(item.profit || 0)
  }));

  const productSource = products.length
    ? products
    : (apiData?.Cargo || []).map((cargo: any) => ({
        ProductName: cargo?.CommodityDescription,
        CommodityDescription: cargo?.CommodityDescription,
        ContainerNo: cargo?.ContainerNo || cargo?.NoofContainers || '',
        ContainerType: cargo?.ContainerType,
        ExternlQty: cargo?.ExternlQty ?? cargo?.NoOfPackage,
        NoOfPackage: cargo?.NoOfPackage,
        GrossWeight: cargo?.GrossWeight,
        Volume: cargo?.Volume,
        NetWeight: cargo?.NetWeight,
        Length: cargo?.Length,
        Width: cargo?.Width,
        Height: cargo?.Height,
        Volumetric: cargo?.Volumetric
      }));

  const productRows: JobCardProductPdfRow[] = productSource.map((item: any) => ({
    commodity: item?.ProductName || item?.CommodityDescription || '',
    containerNo: item?.ContainerNo || item?.NoofContainers || '',
    containerType: getContainerTypeName(item?.masterJobContainer?.ContainerType || item?.ContainerType),
    length: Number(item?.Length || 0),
    width: Number(item?.Width || 0),
    height: Number(item?.Height || 0),
    volumetric: Number(item?.Volumetric || 0),
    noOfPackage: Number(item?.ExternlQty ?? item?.NoOfPackage ?? 0),
    grossWeight: Number(item?.GrossWeight || 0),
    volume: Number(item?.Volume || 0),
    netWeight: Number(item?.NetWeight || 0)
  }));

  const costRevenueCharges: JobCardChargePdfRow[] = charges.map((item: any) => {
    const hasRevenueVoucher = !!(item?.RevenueVoucherHeaderSid || item?.revenueVoucherHeader?.VoucherHeaderSid);
    const hasCostVoucher = !!(item?.CostVoucherHeaderSid || item?.costVoucherHeader?.VoucherHeaderSid);
    const revenueLocalAmount = Number(item?.RevenueLocalAmount || 0);
    const costLocalAmount = Number(item?.CostLocalAmount || 0);
    const actualRevenueLocalAmount = hasRevenueVoucher
      ? Number(
        item?.ActualRevenueLocalAmount ??
        item?.RevenueActualLocalAmount ??
        item?.ActRevenueLocalAmount ??
        item?.ActLocalRevenueAmount ??
        revenueLocalAmount
      )
      : 0;
    const actualCostLocalAmount = hasCostVoucher
      ? Number(
        item?.ActualCostLocalAmount ??
        item?.CostActualLocalAmount ??
        item?.ActCostLocalAmount ??
        item?.ActLocalCostAmount ??
        costLocalAmount
      )
      : 0;

    return {
      chargeName: getChargeName(item.ChargeMasterSid) || item.ChargeDescription || item.ChargeName || '',
      unit: getUnitCode(item.ChargeUomSid),
      revenueCurrency: getCurrencyName(item.RevenueCurrencyMasterSid || item.CostCurrencyMasterSid),
      revenueExchangeRate: Number(item.RevenueExchangeRate || 0),
      revenueRate: Number(item.RevenueRate || 0),
      revenueLocalAmount,
      actualRevenueLocalAmount,
      costCurrency: getCurrencyName(item.CostCurrencyMasterSid),
      costExchangeRate: Number(item.CostExchangeRate || 0),
      costRate: Number(item.CostRate || 0),
      costLocalAmount,
      actualCostLocalAmount
    };
  });

  return {
    reportTitle: `Job Card / Job No - ${apiData?.masterJob?.MasterJobNumber || ''}`,
    selectedDepartmentType: options?.selectedDepartmentType || '',
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
    parties: {
      clientName: apiData?.CustomerName || '',
      clientAddress: apiData?.CustomerAddress || '',
      shipperName: apiData?.ShipperName || '',
      shipperAddress: apiData?.ShipperAddress || '',
      consigneeName: apiData?.ConsigneeName || '',
      consigneeAddress: apiData?.ConsigneeAddress || '',
      forwarderName: apiData?.Others?.[0]?.Forwarder || '',
      forwarderAddress: apiData?.Others?.[0]?.ForwarderAddress || ''
    },
    jobInfo: {
      jobNo: apiData?.masterJob?.MasterJobNumber || '',
      houseNo: apiData?.HBLNo || '',
      masterNo: apiData?.masterJob?.MBLNo || '',
      pol: getPortName(apiData?.POL),
      pod: getPortName(apiData?.POD),
      fpd: getPortName(apiData?.FPD),
      serviceType: apiData?.Cargo?.[0]?.ShipmentTerms || '',
      salesPerson: getSalespersonName(apiData?.SalesmanSid),
      placeOfReceipt: getPortName(apiData?.POO),
      placeOfDelivery: getPortName(apiData?.FPD),
      eta: apiData?.ETA,
      etd: apiData?.ETD,
      vesselOrFlight: joinNonEmpty([apiData?.VesselName, apiData?.VoyageNo], ' / '),
      carrier: apiData?.CarrierName || '',
      freightTerms: apiData?.FreightTerms || ''
    },
    products: productRows,
    productTotals: {
      totalLength: productRows.reduce((sum, item) => sum + Number(item.length || 0), 0),
      totalWidth: productRows.reduce((sum, item) => sum + Number(item.width || 0), 0),
      totalHeight: productRows.reduce((sum, item) => sum + Number(item.height || 0), 0),
      totalVolumetric: productRows.reduce((sum, item) => sum + Number(item.volumetric || 0), 0),
      totalPackages: productRows.reduce((sum, item) => sum + Number(item.noOfPackage || 0), 0),
      totalGrossWeight: productRows.reduce((sum, item) => sum + Number(item.grossWeight || 0), 0),
      totalVolume: productRows.reduce((sum, item) => sum + Number(item.volume || 0), 0),
      totalNetWeight: productRows.reduce((sum, item) => sum + Number(item.netWeight || 0), 0)
    },
    profitSummary: computedProfitSummary,
    profitTotals: {
      totalSales: computedProfitSummary.reduce((sum, item) => sum + Number(item.totalSales || 0), 0),
      totalCost: computedProfitSummary.reduce((sum, item) => sum + Number(item.totalCost || 0), 0),
      profit: computedProfitSummary.reduce((sum, item) => sum + Number(item.profit || 0), 0)
    },
    costRevenueCharges,
    revenueByParty: groupPartyAmounts(charges, 'revenueCustomerMaster', 'RevenueLocalAmount'),
    expenseByParty: groupPartyAmounts(charges, 'costCustomerMaster', 'CostLocalAmount'),
    internalRemarks: apiData?.InternalNote || apiData?.Others?.[0]?.InternalNote || ''
  };
}

function buildProfitSummary(charges: any[], chargeList: any[]): JobCardProfitPdfRow[] {
  const summary = new Map<string, { totalSales: number; totalCost: number; profit: number }>();

  charges.forEach((item: any) => {
    const chargeName = chargeList.find((charge: any) => charge.ChargeMasterSid === item.ChargeMasterSid)?.chargeName || '';
    const existing = summary.get(chargeName) || { totalSales: 0, totalCost: 0, profit: 0 };
    existing.totalCost += item.CostDrCr === 'D' ? Number(item.CostLocalAmount || 0) : -Number(item.CostLocalAmount || 0);
    existing.totalSales += item.RevenueDrCr === 'C' ? Number(item.RevenueLocalAmount || 0) : -Number(item.RevenueLocalAmount || 0);
    existing.profit = existing.totalSales - existing.totalCost;
    summary.set(chargeName, existing);
  });

  return Array.from(summary.entries()).map(([chargeName, totals]) => ({
    chargeName,
    totalSales: totals.totalSales,
    totalCost: totals.totalCost,
    profit: totals.profit
  }));
}

function groupPartyAmounts(charges: any[], customerKey: string, amountKey: string): JobCardPartyAmountRow[] {
  const grouped = new Map<string, number>();

  charges.forEach((item: any) => {
    const party = item?.[customerKey]?.CustomerName;
    const amount = Number(item?.[amountKey] || 0);
    if (party && amount) {
      grouped.set(party, (grouped.get(party) || 0) + amount);
    }
  });

  return Array.from(grouped.entries()).map(([party, amount]) => ({ party, amount }));
}
