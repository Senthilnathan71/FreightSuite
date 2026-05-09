import {
  MasterJobCardChargeRow,
  MasterJobCardContainerRow,
  MasterJobCardPartyAmountRow,
  MasterJobCardPdfData,
  MasterJobCardProfitRow
} from '../interfaces/pdf-document.interfaces';
import { formatDate, formatNumberWithCommas } from '../helpers/pdf-formatters';
import { getPdfStyles } from '../styles/pdf-styles';

export function generateMasterJobCardDocument(data: MasterJobCardPdfData): any {
  const content: any[] = [
    buildJobInfoSection(data)
  ];

  if ((data.selectedFclLcl || '').toUpperCase() !== 'AIR') {
    content.push(buildContainerTable(data));
  }

  content.push(
    buildProfitSummaryTable(data),
    buildCostRevenueLabel(),
    buildCostRevenueTable(data),
    buildRevenueExpenseSection(data),
    buildInternalRemarks(data)
  );

  return {
    pageSize: data.config?.pageSize || 'A4',
    pageOrientation: 'landscape',
    pageMargins: [15, 100, 15, 34],
    background: (_: number, pageSize: any) => ({
      canvas: [{
        type: 'rect',
        x: 12,
        y: 12,
        w: pageSize.width - 24,
        h: pageSize.height - 24,
        lineWidth: 1,
        lineColor: '#000'
      }]
    }),
    header: () => buildHeader(data),
    content,
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    styles: getMasterJobCardStyles(),
    defaultStyle: {
      fontSize: 8,
      color: '#000'
    }
  };
}

function buildHeader(data: MasterJobCardPdfData): any {
  const company = data.company || {} as any;
  const branch = data.branch || {} as any;
  const detailLine1 = branch.addressLine1 || company.addressLine1 || '';
  const detailLine2 = [
    branch.addressLine2 || company.addressLine2 || '',
    branch.cityName || branch.cityMaster?.cityName || company.city || '',
    (branch.postalCode || company.postalCode) ? `Postal Code : ${branch.postalCode || company.postalCode}` : '',
    (branch.phoneNumber || company.phoneNumber) ? `Ph.no : ${branch.phoneNumber || company.phoneNumber}` : ''
  ].filter(Boolean).join(', ');

  return {
    stack: [
      {
        columns: [
          data.logo ? { image: data.logo, fit: [52, 52], width: 62, margin: [4, 4, 0, 0] } : { text: '', width: 62 },
          {
            width: '*',
            stack: [
              { text: (company.companyName || '').toUpperCase(), bold: true, fontSize: 14, alignment: 'center' },
              { text: branch.branchName || '', bold: true, fontSize: 10, alignment: 'center', margin: [0, 1, 0, 0] },
              { text: detailLine1, fontSize: 8, alignment: 'center', margin: [0, 1, 0, 0] },
              { text: detailLine2, fontSize: 8, alignment: 'center', margin: [0, 1, 0, 0] }
            ]
          },
          { text: '', width: 62 }
        ]
      },
      {
        table: {
          widths: ['*'],
          body: [[{ text: '', border: [false, false, false, true] }]]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 0,
          hLineColor: () => '#000',
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        },
        margin: [0, 6, 0, 0]
      },
      buildTitle(data)
    ],
    margin: [15, 12, 15, 6]
  };
}

function buildTitle(data: MasterJobCardPdfData): any {
  return {
    text: data.reportTitle,
    style: 'titleCell',
    margin: [0, 2, 0, 4]
  };
}



function buildPartyCell(label: string, name?: string, address?: string): any {
  return {
    stack: [
      { text: label, style: 'sectionLabel', margin: [0, 0, 0, 4] },
      { text: name || '', style: 'valueText', margin: [18, 0, 0, 2] },
      { text: address || '', style: 'valueText', margin: [18, 0, 0, 0] }
    ],
    minHeight: 54
  };
}

function buildJobInfoSection(data: MasterJobCardPdfData): any {
  const leftItems: Array<[string, string]> = [
    ['Job No.', data.jobInfo.jobNo || ''],
    ['HBL No.', data.jobInfo.houseNo || ''],
    ['POL', data.jobInfo.pol || ''],
    ['POD', data.jobInfo.pod || ''],
    ['FPD', data.jobInfo.fpd || ''],
    ['Service Type', data.jobInfo.serviceType || ''],
    ['Sales Person', data.jobInfo.salesPerson || '']
  ];

  const rightItems: Array<[string, string]> = [
    ['MBL No.', data.jobInfo.masterNo || ''],
    ['Place of Receipt', data.jobInfo.placeOfReceipt || ''],
    ['Place of Delivery', data.jobInfo.placeOfDelivery || ''],
    ['ETA', formatDate(data.jobInfo.eta)],
    ['ETD', formatDate(data.jobInfo.etd)],
    ['Vessel / Voy.', data.jobInfo.vesselOrVoyage || ''],
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
    layout: boxedLayout(4, 8),
    margin: [0, 0, 0, 4]
  };
}

function buildKeyValueRow(label: string, value?: string): any {
  return {
    columns: [
      { text: label, width: 100, style: 'sectionLabel' },
      { text: ':', width: 8 },
      { text: value || '', width: '*', style: 'valueText' }
    ],
    margin: [0, 0, 0, 2]
  };
}

function buildContainerTable(data: MasterJobCardPdfData): any {
  return {
    table: {
      headerRows: 1,
      widths: [90, 60, '*', 58, 58, 58, 58],
      body: [
        [
          { text: 'Container No.', style: 'tableHeader' },
          { text: 'Type', style: 'tableHeader' },
          { text: 'Commodity Description', style: 'tableHeader' },
          { text: 'No. of Pkg', style: 'tableHeader' },
          { text: 'Gross Weight', style: 'tableHeader' },
          { text: 'Volume', style: 'tableHeader' },
          { text: 'Net Weight', style: 'tableHeader' }
        ],
        ...data.containers.map((item) => buildContainerRow(item)),
        [
          { text: 'TOTAL', colSpan: 3, style: 'tableCellBold', alignment: 'right' }, {}, {},
          buildNumberCell(data.containerTotals.totalPackages, 0, true),
          buildNumberCell(data.containerTotals.totalGrossWeight, 3, true),
          buildNumberCell(data.containerTotals.totalVolume, 3, true),
          buildNumberCell(data.containerTotals.totalNetWeight, 3, true)
        ]
      ]
    },
    layout: borderedLayout(),
    margin: [0, 0, 0, 4]
  };
}

function buildContainerRow(item: MasterJobCardContainerRow): any[] {
  return [
    buildTextCell(item.containerNo),
    buildTextCell(item.containerType),
    buildTextCell(item.commodityDescription),
    buildNumberCell(item.noOfPackage, 0),
    buildNumberCell(item.grossWeight, 3),
    buildNumberCell(item.volume, 3),
    buildNumberCell(item.netWeight, 3)
  ];
}

function buildProfitSummaryTable(data: MasterJobCardPdfData): any {
  return {
    table: {
      headerRows: 1,
      widths: ['*', 90, 90, 90],
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
    margin: [0, 0, 0, 4]
  };
}

function buildProfitRow(item: MasterJobCardProfitRow): any[] {
  return [
    buildTextCell(item.chargeName),
    buildNumberCell(item.totalSales, 2),
    buildNumberCell(item.totalCost, 2),
    buildNumberCell(item.profit, 2)
  ];
}

function buildCostRevenueLabel(): any {
  return {
    text: 'Cost / Revenue',
    bold: true,
    decoration: 'underline',
    margin: [0, 2, 0, 4]
  };
}

function buildCostRevenueTable(data: MasterJobCardPdfData): any {
  return {
    table: {
      headerRows: 2,
      widths: [120, '*', 28, 30, 34, 42, 48, 52, 34, 42, 42, 52, 52],
      body: [
        [
          { text: 'Screen', style: 'tableHeader', rowSpan: 2 },
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
        ...data.chargeRows.map((item) => buildChargeRow(item)),
        [
          { text: 'Grand Total', colSpan: 5, style: 'grandTotalCell', alignment: 'right' }, {}, {}, {}, {},
          buildNumberCell(data.chargeTotals.totalRevenueRate, 2, true, true),
          buildNumberCell(data.chargeTotals.totalRevenueLocalAmount, 2, true, true),
          buildNumberCell(data.chargeTotals.totalActualRevenueLocalAmount, 2, true, true),
          { text: '', style: 'grandTotalCell' },
          { text: '', style: 'grandTotalCell' },
          buildNumberCell(data.chargeTotals.totalCostRate, 2, true, true),
          buildNumberCell(data.chargeTotals.totalCostLocalAmount, 2, true, true),
          buildNumberCell(data.chargeTotals.totalActualCostLocalAmount, 2, true, true)
        ]
      ]
    },
    layout: compactBorderedLayout(),
    margin: [0, 0, 0, 4]
  };
}

function buildChargeRow(item: MasterJobCardChargeRow): any[] {
  return [
    buildTextCell(item.screen, true, false),
    buildTextCell(item.chargeName),
    buildTextCell(item.unit, false, false, 'center'),
    buildTextCell(item.revenueCurrency, false, false, 'center'),
    buildNumberCell(item.revenueExchangeRate, 3),
    buildNumberCell(item.revenueRate, 2),
    buildNumberCell(item.revenueLocalAmount, 2),
    buildNumberCell(item.actualRevenueLocalAmount, 2),
    buildTextCell(item.costCurrency, false, false, 'center'),
    buildNumberCell(item.costExchangeRate, 3),
    buildNumberCell(item.costRate, 2),
    buildNumberCell(item.costLocalAmount, 2),
    buildNumberCell(item.actualCostLocalAmount, 2)
  ];
}

function compactBorderedLayout(): any {
  return {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingTop: () => 2,
    paddingBottom: () => 2,
    paddingLeft: () => 3,
    paddingRight: () => 3
  };
}

function buildRevenueExpenseSection(data: MasterJobCardPdfData): any {
  return {
    columns: [
      buildPartyAmountTable('Revenue', 'Sales Party', data.revenueByParty),
      buildPartyAmountTable('Expense', 'Cost Party', data.expenseByParty)
    ],
    columnGap: 8,
    margin: [0, 0, 0, 4]
  };
}

function buildPartyAmountTable(title: string, label: string, items: MasterJobCardPartyAmountRow[]): any {
  return {
    width: '50%',
    stack: [
      { text: title, style: 'subTitle', margin: [0, 0, 0, 3] },
      {
        table: {
          headerRows: 1,
          widths: [120, '*', 64],
          body: [
            [
              { text: 'Screen', style: 'tableHeader' },
              { text: label, style: 'tableHeader' },
              { text: 'Amount', style: 'tableHeader' }
            ],
            ...items.map((item) => [
              buildTextCell(item.screen, true),
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

function buildInternalRemarks(data: MasterJobCardPdfData): any {
  return {
    columns: [
      { text: 'Internal Remarks', style: 'sectionLabel', width: 110 },
      { text: ':', width: 8 },
      { text: data.internalRemarks || '', width: '*' }
    ],
    margin: [0, 2, 0, 0]
  };
}

function buildFooter(data: MasterJobCardPdfData, currentPage: number, pageCount: number): any {
  return {
    margin: [18, 0, 18, 6],
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, fontSize: 7, width: '50%', noWrap: true },
      // {
      //   text: 'This document is computer-generated and does not require a signature.',
      //   alignment: 'center',
      //   fontSize: 7,
      //   width: '50%'
      // },
      {
        text: `Printed On : ${formatDate(new Date())}  Page: ${currentPage} of ${pageCount}`,
        alignment: 'right',
        fontSize: 7,
        width: '50%',
        noWrap: true
      }
    ]
  };
}

function buildTextCell(
  value?: string,
  bold = false,
  noWrap = false,
  alignment: 'left' | 'center' | 'right' = 'left'
): any {
  return {
    text: value || '',
    style: bold ? 'tableCellBold' : 'tableCell',
    noWrap,
    alignment
  };
}

function buildNumberCell(value?: number, decimals = 2, bold = false, highlight = false): any {
  return {
    text: formatNumberWithCommas(value || 0, decimals),
    style: highlight ? 'grandTotalCell' : (bold ? 'tableCellBold' : 'tableCell'),
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
    paddingLeft: () => 8,
    paddingRight: () => 8
  };
}

function getMasterJobCardStyles(): any {
  return {
    ...getPdfStyles(),
    titleCell: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 4, 0, 4] },
    subTitle: { fontSize: 9, bold: true, alignment: 'center' },
    sectionLabel: { fontSize: 8, bold: true },
    valueText: { fontSize: 8 },
    tableHeader: { fontSize: 8, bold: true, alignment: 'center' },
    tableCell: { fontSize: 7 },
    tableCellBold: { fontSize: 7, bold: true },
    grandTotalCell: { fontSize: 7, bold: true, fillColor: '#dfeffb' }
  };
}

export function transformMasterJobCardApiData(
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
    selectedFCLLCL?: string;
  }
): MasterJobCardPdfData {
  const getPortName = (portCode?: string): string => {
    if (!portCode) return '';
    const port = (options?.portList || []).find((item: any) => item.PortCode === portCode);
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  };

  const getContainerTypeName = (containerTypeMasterSid?: number): string => {
    if (!containerTypeMasterSid) return '';
    const match = (options?.containerTypeList || []).find((item: any) => item.ContainerTypeMasterSid === containerTypeMasterSid);
    return match?.ContainerName || '';
  };

  const getChargeName = (chargeMasterSid?: number): string => {
    if (!chargeMasterSid) return '';
    const match = (options?.chargeList || []).find((item: any) => item.ChargeMasterSid === chargeMasterSid);
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

  const containers: MasterJobCardContainerRow[] = (apiData?.containers || []).map((container: any) => ({
    containerNo: container?.ContainerNumber || '',
    containerType: getContainerTypeName(container?.ContainerType),
    commodityDescription: container?.CommodityDescription || '',
    noOfPackage: Number(container?.NoOfPkg || 0),
    grossWeight: Number(container?.GrossWeight || 0),
    volume: Number(container?.Volume || 0),
    netWeight: Number(container?.NetWeight || 0)
  }));

  const computedProfitSummary: MasterJobCardProfitRow[] = (options?.profitSummary?.length ? options.profitSummary : []).map((item: any) => ({
    chargeName: item.chargeName || '',
    totalSales: Number(item.totalSales || 0),
    totalCost: Number(item.totalCost || 0),
    profit: Number(item.profit || 0)
  }));

  const buildChargeRows = (charges: any[], screen: string): MasterJobCardChargeRow[] =>
    (charges || []).map((item: any) => {
      const voucherActuals = getActualAmountsFromVoucherDetails(item);
      const hasRevenueVoucher = !!(item?.RevenueVoucherHeaderSid || item?.revenueVoucherHeader?.VoucherHeaderSid);
      const hasCostVoucher = !!(item?.CostVoucherHeaderSid || item?.costVoucherHeader?.VoucherHeaderSid);
      const revenueLocalAmount = Number(item?.RevenueLocalAmount || 0);
      const costLocalAmount = Number(item?.CostLocalAmount || 0);
      const actualRevenueLocalAmount = voucherActuals.revenue !== 0
        ? voucherActuals.revenue
        : (hasRevenueVoucher
          ? Number(
            item?.ActualRevenueLocalAmount ??
            item?.RevenueActualLocalAmount ??
            item?.ActRevenueLocalAmount ??
            item?.ActLocalRevenueAmount ??
            revenueLocalAmount
          )
          : 0);
      const actualCostLocalAmount = voucherActuals.cost !== 0
        ? voucherActuals.cost
        : (hasCostVoucher
          ? Number(
            item?.ActualCostLocalAmount ??
            item?.CostActualLocalAmount ??
            item?.ActCostLocalAmount ??
            item?.ActLocalCostAmount ??
            costLocalAmount
          )
          : 0);

      return {
        screen,
        chargeName: getChargeName(item?.ChargeMasterSid),
        unit: getUnitCode(item?.ChargeUomSid),
        revenueCurrency: getCurrencyName(item?.RevenueCurrencyMasterSid || item?.CostCurrencyMasterSid),
        revenueExchangeRate: Number(item?.RevenueExchangeRate || item?.CostExchangeRate || 0),
        revenueRate: Number(item?.RevenueRate || 0),
        revenueLocalAmount,
        actualRevenueLocalAmount,
        costCurrency: getCurrencyName(item?.CostCurrencyMasterSid),
        costExchangeRate: Number(item?.CostExchangeRate || 0),
        costRate: Number(item?.CostRate || 0),
        costLocalAmount,
        actualCostLocalAmount
      };
    });

  const masterCharges = Array.isArray(apiData?.costRevenueCharges) ? apiData.costRevenueCharges : [];
  const houseCharges = Array.isArray(apiData?.houseJob)
    ? apiData.houseJob.flatMap((house: any) =>
        buildChargeRows(
          Array.isArray(house?.costRevenueCharges) ? house.costRevenueCharges : [],
          `House - ${house?.HBLNo || house?.ShipmentNo || 'House Job'}`
        )
      )
    : [];

  const chargeRows: MasterJobCardChargeRow[] = [
    ...buildChargeRows(masterCharges, 'Master'),
    ...houseCharges
  ];

  const groupPartyAmounts = (items: any[], screen: string, customerKey: string, amountKey: string): MasterJobCardPartyAmountRow[] => {
    const grouped = new Map<string, number>();

    items.forEach((item: any) => {
      const party = item?.[customerKey]?.CustomerName;
      const amount = Number(item?.[amountKey] || 0);

      if (party && amount) {
        grouped.set(party, (grouped.get(party) || 0) + amount);
      }
    });

    return Array.from(grouped.entries()).map(([party, amount]) => ({
      screen,
      party,
      amount
    }));
  };

  const revenueByParty: MasterJobCardPartyAmountRow[] = [
    ...groupPartyAmounts(masterCharges, 'Master Job', 'revenueCustomerMaster', 'RevenueLocalAmount'),
    ...(apiData?.houseJob || []).flatMap((house: any) =>
      groupPartyAmounts(
        Array.isArray(house?.costRevenueCharges) ? house.costRevenueCharges : [],
        `House Job - ${house?.HBLNo || house?.ShipmentNo || 'House Job'}`,
        'revenueCustomerMaster',
        'RevenueLocalAmount'
      )
    )
  ];

  const expenseByParty: MasterJobCardPartyAmountRow[] = [
    ...groupPartyAmounts(masterCharges, 'Master Job', 'costCustomerMaster', 'CostLocalAmount'),
    ...(apiData?.houseJob || []).flatMap((house: any) =>
      groupPartyAmounts(
        Array.isArray(house?.costRevenueCharges) ? house.costRevenueCharges : [],
        `House Job - ${house?.HBLNo || house?.ShipmentNo || 'House Job'}`,
        'costCustomerMaster',
        'CostLocalAmount'
      )
    )
  ];

  return {
    reportTitle: `Job Card / Job No - ${apiData?.MasterJobNumber || ''}`,
    selectedFclLcl: options?.selectedFCLLCL || '',
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
      clientName: apiData?.houseJob?.[0]?.CustomerName || '',
      clientAddress: apiData?.houseJob?.[0]?.CustomerAddress || '',
      shipperName: apiData?.houseJob?.[0]?.ShipperName || '',
      shipperAddress: apiData?.houseJob?.[0]?.ShipperAddress || '',
      consigneeName: apiData?.houseJob?.[0]?.ConsigneeName || '',
      consigneeAddress: apiData?.houseJob?.[0]?.ConsigneeAddress || '',
      forwarderName: apiData?.houseJob?.[0]?.Others?.[0]?.Forwarder || '',
      forwarderAddress: apiData?.houseJob?.[0]?.Others?.[0]?.ForwarderAddress || ''
    },
    jobInfo: {
      jobNo: apiData?.MasterJobNumber || '',
      houseNo: apiData?.houseJob?.[0]?.HBLNo || '',
      masterNo: apiData?.MBLNo || '',
      pol: getPortName(apiData?.POL),
      pod: getPortName(apiData?.POD),
      fpd: getPortName(apiData?.FPD),
      serviceType: apiData?.ShipmentTerms || '',
      salesPerson: getSalespersonName(apiData?.houseJob?.[0]?.SalesmanSid),
      placeOfReceipt: getPortName(apiData?.POO),
      placeOfDelivery: getPortName(apiData?.POD),
      eta: apiData?.voyages?.[0]?.ETA,
      etd: apiData?.voyages?.[0]?.ETD,
      vesselOrVoyage: [apiData?.voyages?.[0]?.VesselName, apiData?.voyages?.[0]?.VoyageNo].filter(Boolean).join(' / '),
      carrier: apiData?.voyages?.[0]?.CarrierName || '',
      freightTerms: apiData?.houseJob?.[0]?.FreightTerms || ''
    },
    containers,
    containerTotals: {
      totalPackages: containers.reduce((sum, item) => sum + Number(item.noOfPackage || 0), 0),
      totalGrossWeight: containers.reduce((sum, item) => sum + Number(item.grossWeight || 0), 0),
      totalVolume: containers.reduce((sum, item) => sum + Number(item.volume || 0), 0),
      totalNetWeight: containers.reduce((sum, item) => sum + Number(item.netWeight || 0), 0)
    },
    profitSummary: computedProfitSummary,
    profitTotals: {
      totalSales: computedProfitSummary.reduce((sum, item) => sum + Number(item.totalSales || 0), 0),
      totalCost: computedProfitSummary.reduce((sum, item) => sum + Number(item.totalCost || 0), 0),
      profit: computedProfitSummary.reduce((sum, item) => sum + Number(item.profit || 0), 0)
    },
    chargeRows,
    chargeTotals: {
      totalRevenueRate: chargeRows.reduce((sum, item) => sum + Number(item.revenueRate || 0), 0),
      totalRevenueLocalAmount: chargeRows.reduce((sum, item) => sum + Number(item.revenueLocalAmount || 0), 0),
      totalActualRevenueLocalAmount: chargeRows.reduce((sum, item) => sum + Number(item.actualRevenueLocalAmount || 0), 0),
      totalCostRate: chargeRows.reduce((sum, item) => sum + Number(item.costRate || 0), 0),
      totalCostLocalAmount: chargeRows.reduce((sum, item) => sum + Number(item.costLocalAmount || 0), 0),
      totalActualCostLocalAmount: chargeRows.reduce((sum, item) => sum + Number(item.actualCostLocalAmount || 0), 0)
    },
    revenueByParty,
    expenseByParty,
    internalRemarks: apiData?.others?.[0]?.InternalNote || ''
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
