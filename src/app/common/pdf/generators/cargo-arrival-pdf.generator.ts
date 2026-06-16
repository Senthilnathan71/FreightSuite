import {
  CargoArrivalChargePdfRow,
  CargoArrivalContainerPdfRow,
  CargoArrivalPdfData,
} from '../interfaces/pdf-document.interfaces';
import {
  formatDate,
  formatNumberWithCommas,
  joinNonEmpty,
} from '../helpers/pdf-formatters';
import { getPdfStyles } from '../styles/pdf-styles';

const RIGHT_LABEL_WIDTH = 95;
const COLON_WIDTH = 8;

export function generateCargoArrivalDocument(data: CargoArrivalPdfData): any {
  const isFcl = (data.selectedFclLcl || '').toUpperCase() === 'FCL';

  return {
    pageSize: data.config?.pageSize || 'A4',
    pageOrientation: 'portrait',
    pageMargins: [15, 10, 15, 36],
    background: (_: number, pageSize: any) => ({
      canvas: [
        {
          type: 'rect',
          x: 14,
          y: 14,
          w: pageSize.width - 28,
          h: pageSize.height - 28,
          lineWidth: 0.25,
          lineColor: '#000',
        },
      ],
    }),
    content: [
      buildHeader(data),
      buildTitle(data),
      buildCustomerReferenceSection(data),
      buildPartySection(data),
      buildReleaseSection(data),
      buildRoutingSection(data),
      isFcl ? buildFclTable(data.fclContainers) : buildLclTable(data),
      ...(data.withOrWithoutCharge
        ? [buildChargesTable(data), buildAmountInWords(data)]
        : []),
      buildClosing(data),
    ],
    footer: (currentPage: number, pageCount: number) =>
      buildFooter(data, currentPage, pageCount),
    styles: getCargoArrivalStyles(),
    defaultStyle: {
      fontSize: 10,
      color: '#000',
    },
  };
}

function topBottomBorderLayout() {
  return {
    hLineWidth: function (i: number, node: any) {
      // Top border
      if (i === 0) return 0.25;

      // Middle border (between rows)
      if (i === 1) return 0.25;

      // Bottom border
      if (i === node.table.body.length) return 0.25;

      return 0;
    },

    vLineWidth: function () {
      return 0; // No vertical lines
    },

    paddingLeft: () => 5,
    paddingRight: () => 5,
    paddingTop: () => 8,
    paddingBottom: () => 8,
  };
}

function buildHeader(data: CargoArrivalPdfData): any {
  const company: any = data.company || {};
  const branch: any = data.branch || {};
  const logoPosition = 'left' as 'left' | 'center' | 'right';
  const companyPosition = 'center' as 'left' | 'center' | 'right';
  const companyAlignment = 'center' as 'left' | 'center' | 'right';
  const detailLine1 = branch?.addressLine1 || company?.addressLine1 || '';
  const addressLine2 = branch?.addressLine2 || company?.addressLine2 || '';
  const cityName = branch?.cityName || branch?.cityMaster?.cityName || company?.city || '';
  const postalCode = branch?.postalCode || company?.postalCode || '';
  const phoneNumber = branch?.phoneNumber || company?.phoneNumber || '';
  const detailLine2: any[] = [
    joinNonEmpty([addressLine2, cityName], ', '),
  ];

  if (postalCode) {
    detailLine2.push(
      detailLine2[0] ? ', ' : '',
      { text: 'Postal Code : ', bold: true },
      postalCode,
    );
  }

  if (phoneNumber) {
    detailLine2.push(
      detailLine2.length > 1 || detailLine2[0] ? ', ' : '',
      { text: 'Ph.no : ', bold: true },
      phoneNumber,
    );
  }

  const companyDetails = {
    stack: [
      {
        text: (company?.companyName || '').toUpperCase(),
        bold: true,
        fontSize: 14,
        alignment: companyAlignment,
      },
      {
        text: branch?.branchName || '',
        bold: true,
        fontSize: 11,
        alignment: companyAlignment,
        margin: [0, 1, 0, 0],
      },
      {
        text: detailLine1,
        fontSize: 9,
        alignment: companyAlignment,
        margin: [0, 1, 0, 0],
      },
      {
        text: detailLine2,
        fontSize: 8.5,
        alignment: companyAlignment,
        noWrap: true,
        margin: [0, 1, 0, 0],
      },
    ],
  };

  return {
    columns: [
      {
        width: 90,
        stack: [
          logoPosition === 'left' ? buildHeaderLogo(data.logo, 'left') : { text: '' },
          companyPosition === 'left' ? companyDetails : { text: '' },
        ],
      },
      {
        width: '*',
        stack: [
          logoPosition === 'center' ? buildHeaderLogo(data.logo, 'center') : { text: '' },
          companyPosition === 'center' ? companyDetails : { text: '' },
        ],
      },
      {
        width: 90,
        stack: [
          logoPosition === 'right' ? buildHeaderLogo(data.logo, 'right') : { text: '' },
          companyPosition === 'right' ? companyDetails : { text: '' },
        ],
      },
    ],
    margin: [0, 0, 0, 2],
  };
}

function buildHeaderLogo(
  logo: string | undefined,
  alignment: 'left' | 'center' | 'right',
): any {
  if (!logo) {
    return { text: '' };
  }

  return {
    image: logo,
    fit: [50, 50],
    alignment,
    margin: [4, 6, 0, 0],
  };
}

function buildTitle(data: CargoArrivalPdfData): any {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: data.reportTitle,
            bold: true,
            alignment: 'center',
            fontSize: 10,
            margin: [0, 4, 0, 4],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: (i: number) => (i === 0 ? 0.25 : 0),
      vLineWidth: () => 0,
      hLineColor: () => '#000',
    },
    margin: [0, 0, 0, 6],
  };
}

function buildCustomerReferenceSection(data: CargoArrivalPdfData): any {
  return {
    columns: [
      {
        width: '50%',
        text: data.customerBlock || '',
        style: 'sectionValue',
        bold: true,
        margin: [6, 4, 0, 0],
      },
      {
        width: '50%',
        stack: [
          buildKeyValueRow('HBL', data.referenceInfo.hblNo, RIGHT_LABEL_WIDTH),
          buildKeyValueRow(
            'HBL Date',
            formatDate(data.referenceInfo.hblDate),
            RIGHT_LABEL_WIDTH,
          ),
          buildKeyValueRow('Booking No.', data.referenceInfo.bookingNo, RIGHT_LABEL_WIDTH),
        ],
      },
    ],
    margin: [5, 0, 5, 8],
  };
}

function buildPartySection(data: CargoArrivalPdfData): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [
        [
          buildPartyCell(
            'Shipper',
            data.parties.shipperName,
            data.parties.shipperAddress,
          ),
          buildPartyCell(
            'Consignee',
            data.parties.consigneeName,
            data.parties.consigneeAddress,
          ),
        ],
        [
          buildPartyCell(
            'Notify Party',
            data.parties.notifyName,
            data.parties.notifyAddress,
          ),
          buildPartyCell(
            'Goods Available At',
            data.parties.goodsAvailableAt,
            '',
          ),
        ],
      ],
    },
    layout: topBottomBorderLayout(),
    margin: [0, 0, 0, 0],
  };
}

function buildReleaseSection(data: CargoArrivalPdfData): any {
  const leftItems: Array<[string, string]> = [
    ['Release Type', data.releaseInfo.releaseType || ''],
    ['Goods To be Cleared By', data.releaseInfo.clearedBy || ''],
    ['Ocean Bill of Lading', data.releaseInfo.oceanBillOfLading || ''],
    ['Goods Description', data.releaseInfo.goodsDescription || ''],
  ];

  const rightItems: Array<[string, string]> = [
    ['Commodity', data.releaseInfo.commodity || ''],
    ['Order No./Ref.', data.releaseInfo.orderReference || ''],
    ['Final Destination', data.releaseInfo.finalDestination || ''],
    ['Marks and No.', data.releaseInfo.marksAndNumber || ''],
  ];

  return {
    stack: [
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                stack: leftItems.map(([label, value]) =>
                  buildWrappedKeyValueRow(label, value, RIGHT_LABEL_WIDTH),
                ),
                border: [false, false, false, false],
              },
              {
                stack: rightItems.map(([label, value]) =>
                  buildWrappedKeyValueRow(label, value, RIGHT_LABEL_WIDTH),
                ),
                border: [false, false, false, false],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 565,
            y2: 0,
            lineWidth: 0.25,
          },
        ],
      },
    ],
    margin: [0, 0, 0, 2],
  };
}

function buildRoutingSection(data: CargoArrivalPdfData): any {
  const leftItems: Array<[string, string]> = [
    ['Mode', data.routingInfo.mode || ''],
    ['Vessel', data.routingInfo.vessel || ''],
    ['Voyage', data.routingInfo.voyage || ''],
    ['Final Destination', data.routingInfo.finalDestination || ''],
  ];
  const rightItems: Array<[string, string]> = [
    ['Port of Loading', data.routingInfo.portOfLoading || ''],
    ['Port of Discharge', data.routingInfo.portOfDischarge || ''],
    ['ETD', formatDate(data.routingInfo.etd)],
    ['ETA', formatDate(data.routingInfo.eta)],
  ];

  return {
    stack: [
      { text: 'Routing Information', style: 'subTitle', margin: [5, 0, 0, 4] },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                stack: leftItems.map(([label, value]) =>
                  buildKeyValueRow(label, value, RIGHT_LABEL_WIDTH),
                ),
                border: [true, true, false, true],
              },
              {
                stack: rightItems.map(([label, value]) =>
                  buildKeyValueRow(label, value, RIGHT_LABEL_WIDTH),
                ),
                border: [false, true, true, true],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function (i: number, node: any) {
            if (i === 0) return 0.25; // top
            if (i === node.table.body.length) return 0.25; // bottom
            return 0;
          },
          vLineWidth: function () {
            return 0; // ❌ removes left & right borders
          },
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
      },
    ],
    margin: [0, 0, 0, 8],
  };
}

function buildFclTable(rows: CargoArrivalContainerPdfRow[]): any {
  return {
    table: {
      headerRows: 1,
      widths: [70, 64, 52, '*', 58, 58],
      body: [
        [
          { text: 'Container', style: 'tableHeader' },
          { text: 'Container Type', style: 'tableHeader' },
          { text: 'Seal', style: 'tableHeader' },
          { text: 'Package Type', style: 'tableHeader' },
          { text: 'Gross Weight', style: 'tableHeader' },
          { text: 'Volume', style: 'tableHeader' },
        ],
        ...rows.map((item) => [
          buildTextCell(item.containerNo),
          buildTextCell(item.containerType),
          buildTextCell(item.seal),
          buildTextCell(item.packageType),
          buildNumberCell(item.grossWeight, 3),
          buildNumberCell(item.volume, 3),
        ]),
      ],
    },
    layout: borderedLayout(),
    margin: [0, 0, 0, 8],
  };
}

function buildLclTable(data: CargoArrivalPdfData): any {
  return {
    table: {
      headerRows: 1,
      widths: ['*', '*', '*', '*'],
      body: [
        [
          { text: 'No. of Packages', style: 'tableHeader' },
          { text: 'Gross Weight', style: 'tableHeader' },
          { text: 'Net Weight', style: 'tableHeader' },
          { text: 'Volume', style: 'tableHeader' },
        ],
        [
          buildNumberCell(data.lclSummary.noOfPackages, 0),
          buildNumberCell(data.lclSummary.grossWeight, 3),
          buildNumberCell(data.lclSummary.netWeight, 3),
          buildNumberCell(data.lclSummary.volume, 3),
        ],
      ],
    },
    layout: borderedLayout(),
    margin: [5, 0, 5, 8],
  };
}

function buildChargesTable(data: CargoArrivalPdfData): any {
  return {
    table: {
      headerRows: 1,
      widths: ['*', 50, 34, 48, 52, 52, 58],
      body: [
        [
          { text: 'Charge Description', style: 'tableHeader' },
          { text: 'Unit', style: 'tableHeader' },
          { text: 'Curr.', style: 'tableHeader' },
          { text: 'Ex.Rate', style: 'tableHeader' },
          { text: 'Per Unit', style: 'tableHeader' },
          { text: 'Amt.', style: 'tableHeader' },
          { text: 'Local Amt.', style: 'tableHeader' },
        ],
        ...data.charges.map((item) => buildChargeRow(item)),
        [
          {
            text: 'Total',
            colSpan: 4,
            style: 'tableCellBold',
            alignment: 'right',
          },
          {},
          {},
          {},
          buildNumberCell(data.chargeTotals.totalPerUnit, 2, true),
          buildNumberCell(data.chargeTotals.totalAmount, 2, true),
          buildNumberCell(data.chargeTotals.totalLocalAmount, 3, true),
        ],
      ],
    },
    layout: borderedLayout1(),
    margin: [0, 0, 0, 8],
  };
}

function buildChargeRow(item: CargoArrivalChargePdfRow): any[] {
  return [
    buildTextCell(item.chargeDescription),
    buildTextCell(item.unit),
    buildTextCell(item.currency, false, 'center'),
    buildNumberCell(item.exchangeRate, 2),
    buildNumberCell(item.perUnit, 2),
    buildNumberCell(item.amount, 2),
    buildNumberCell(item.localAmount, 3),
  ];
}

function buildAmountInWords(data: CargoArrivalPdfData): any {
  return {
    columns: [
      { text: 'Amount in Words', width: 100, style: 'sectionLabel' },
      { text: ':', width: 8, style: 'sectionLabel' },
      {
        text: data.amountInWords || '',
        width: '*',
        style: 'sectionValue',
        bold: true,
      },
    ],
    margin: [10, 2, 10, 8],
  };
}

function buildClosing(data: CargoArrivalPdfData): any {
  return {
    stack: [
      { text: 'Yours sincerely', bold: true, fontSize: 10 },
      { text: data.signatoryName || '', margin: [0, 8, 0, 0], fontSize: 9 },
    ],
    margin: [10, 8, 10, 0],
  };
}

function buildPartyCell(label: string, line1?: string, line2?: string): any {
  return {
    stack: [
      { text: label, style: 'sectionLabel', margin: [0, 0, 0, 4] },
      { text: joinNonEmpty([line1, line2], '\n'), style: 'sectionValue' },
    ],
    minHeight: 48,
  };
}

function buildKeyValueRow(
  label: string,
  value?: string,
  labelWidth = RIGHT_LABEL_WIDTH,
): any {
  return {
    columns: [
      { text: label, width: labelWidth, style: 'sectionLabel' },
      { text: ':', width: COLON_WIDTH, style: 'sectionLabel' },
      { text: value || '', width: '*', style: 'sectionValue' },
    ],
    margin: [0, 0, 0, 3],
  };
}

function buildWrappedKeyValueRow(
  label: string,
  value?: string,
  labelWidth = RIGHT_LABEL_WIDTH,
): any {
  return {
    columns: [
      { text: label, width: labelWidth, style: 'sectionLabel' },
      { text: ':', width: COLON_WIDTH, style: 'sectionLabel' },
      { text: value || '', width: '*', style: 'sectionValue' },
    ],
    margin: [0, 0, 0, 4],
  };
}

function buildTextCell(
  value?: string,
  bold = false,
  alignment: 'left' | 'center' | 'right' = 'left',
): any {
  return {
    text: value || '',
    style: bold ? 'tableCellBold' : 'tableCell',
    alignment,
  };
}

function buildNumberCell(value?: number, decimals = 2, bold = false): any {
  return {
    text: formatNumberWithCommas(value || 0, decimals),
    style: bold ? 'tableCellBold' : 'tableCell',
    alignment: 'right',
  };
}

function boxedLayout(padding: number, sidePadding: number): any {
  return {
    hLineWidth: () => 0.25,
    vLineWidth: () => 0.25,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingTop: () => padding,
    paddingBottom: () => padding,
    paddingLeft: () => sidePadding,
    paddingRight: () => sidePadding,
  };
}

function borderedLayout(): any {
  return {
    hLineWidth: () => 0.25,
    vLineWidth: () => 0.25,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingTop: () => 3,
    paddingBottom: () => 3,
    paddingLeft: () => 4,
    paddingRight: () => 4,
  };
}

function borderedLayout1(): any {
  return {
    hLineWidth: () => 0.25,

    vLineWidth: function (i: number, node: any) {
      if (i === 0) return 0;
      if (i === node.table.widths.length) return 0;
      return 0.25;
    },

    hLineColor: () => '#000',
    vLineColor: () => '#000',

    paddingTop: () => 3,
    paddingBottom: () => 3,
    paddingLeft: () => 4,
    paddingRight: () => 4,
  };
}

function getCargoArrivalStyles(): any {
  return {
    ...getPdfStyles(),
    subTitle: { fontSize: 11, bold: true },
    sectionLabel: { fontSize: 8, bold: true },
    sectionValue: { fontSize: 8 },
    tableHeader: {
      fontSize: 8,
      bold: true,
      alignment: 'center',
    },
    tableCell: { fontSize: 8 },
    tableCellBold: { fontSize: 8, bold: true },
  };
}

function buildFooter(
  data: CargoArrivalPdfData,
  currentPage?: number,
  pageCount?: number,
): any {
  return {
    margin: [24, 0, 24, 2],
    columns: [
      {
        text: `Printed By : ${data.userData?.userName || ''}`,
        alignment: 'left',
        width: 120,
        fontSize: 8,
        noWrap: true,
      },
      {
        text: 'This document is computer-generated and does not require a signature.',
        alignment: 'center',
        width: '*',
        fontSize: 8,
        noWrap: true,
      },
      {
        text: `Printed On : ${formatDate(new Date())}`,
        alignment: 'right',
        width: 120,
        fontSize: 8,
        noWrap: true,
      },
      {
        text:
          currentPage && pageCount
            ? `Page ${currentPage} of ${pageCount}`
            : '',
        alignment: 'right',
        width: 60,
        fontSize: 8,
        noWrap: true,
      },
    ],
  };
}

export function transformCargoArrivalApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    masterJobContainers?: any[];
    withOrWithoutCharge?: boolean;
    selectedFCLLCL?: string;
    currencyList?: any[];
    uomList?: any[];
    containerTypeList?: any[];
    packageTypeList?: any[];
    portList?: any[];
    amountInWords?: string;
  },
): CargoArrivalPdfData {
  const cargo = apiData?.Cargo?.[0] || {};
  const other = apiData?.Others?.[0] || {};
  const charges = apiData?.costRevenueCharges || [];

  const getPortName = (portCode?: string): string => {
    if (!portCode) return '';
    const port = (options?.portList || []).find(
      (item: any) => item.PortCode === portCode,
    );
    return port ? `${port.PortCode} - ${port.PortName}` : portCode;
  };

  const getCurrencyCode = (currencyMasterSid?: number): string => {
    if (!currencyMasterSid) return '';
    const match = (options?.currencyList || []).find(
      (item: any) => item.CurrencyMasterSid === currencyMasterSid,
    );
    return match?.currencyCode || match?.CurrencyCode || '';
  };

  const getUnitCode = (uomSid?: number): string => {
    if (!uomSid) return '';
    const match = (options?.uomList || []).find(
      (item: any) => item.UOMMasterSid === uomSid,
    );
    return match?.UOMName || match?.UOMCode || '';
  };

  const getContainerName = (containerTypeMasterSid?: number): string => {
    if (!containerTypeMasterSid) return '';
    const match = (options?.containerTypeList || []).find(
      (item: any) => item.ContainerTypeMasterSid === containerTypeMasterSid,
    );
    return match?.ContainerName || '';
  };

  const getPackageTypeName = (pkgTypeSid?: number): string => {
    if (!pkgTypeSid) return '';
    const match = (options?.packageTypeList || []).find(
      (item: any) => item.UOMMasterSid === pkgTypeSid,
    );
    return match?.UOMName || '';
  };

  const fclContainers: CargoArrivalContainerPdfRow[] = (
    options?.masterJobContainers || []
  ).map((container: any) => ({
    containerNo: container?.ContainerNumber || '',
    containerType: getContainerName(container?.ContainerType),
    seal: container?.LineSeal || '',
    packageType: getPackageTypeName(container?.PkgType),
    grossWeight: Number(container?.GrossWeight || 0),
    volume: Number(container?.Volume || 0),
  }));

  const chargeRows: CargoArrivalChargePdfRow[] = charges.map((item: any) => ({
    chargeDescription: item?.ChargeDescription || '',
    unit: getUnitCode(item?.ChargeUomSid),
    currency: getCurrencyCode(item?.RevenueCurrencyMasterSid),
    exchangeRate: Number(item?.RevenueExchangeRate || 0),
    perUnit: Number(item?.RevenueRate || 0),
    amount: Number(item?.RevenueAmount || 0),
    localAmount: Number(item?.RevenueLocalAmount || 0),
  }));

  const chargeTotals = chargeRows.reduce(
    (acc, item) => {
      acc.totalPerUnit += Number(item.perUnit || 0);
      acc.totalAmount += Number(item.amount || 0);
      acc.totalLocalAmount += Number(item.localAmount || 0);
      return acc;
    },
    { totalPerUnit: 0, totalAmount: 0, totalLocalAmount: 0 },
  );

  return {
    company,
    branch,
    userData,
    logo,
    reportTitle: `CARGO ARRIVAL NOTICE ${options?.withOrWithoutCharge ? 'WITH' : 'WITHOUT'} CHARGES`,
    withOrWithoutCharge: !!options?.withOrWithoutCharge,
    selectedFclLcl: options?.selectedFCLLCL || '',
    customerBlock: joinNonEmpty(
      [apiData?.CustomerName, apiData?.CustomerAddress],
      '\n',
    ),
    referenceInfo: {
      hblNo: apiData?.HBLNo || '',
      hblDate: apiData?.HBLDate,
      bookingNo: apiData?.BookingNo || '',
    },
    parties: {
      shipperName: apiData?.ShipperName || '',
      shipperAddress: apiData?.ShipperAddress || '',
      consigneeName: apiData?.ConsigneeName || '',
      consigneeAddress: apiData?.ConsigneeAddress || '',
      notifyName: apiData?.Notify || other?.NotifyParty || '',
      notifyAddress: apiData?.NotifyAddress || other?.NotifyPartyAddress || '',
      goodsAvailableAt: other?.YardCFS || '',
    },
    releaseInfo: {
      releaseType: other?.ReleaseType || '',
      clearedBy: other?.CHAName || '',
      oceanBillOfLading: apiData?.MBLNo || '',
      goodsDescription: cargo?.CommodityDescription || '',
      commodity: apiData?.Products?.[0]?.ProductName || '',
      orderReference: other?.CustomerRefNo || '',
      finalDestination: getPortName(apiData?.FPD),
      marksAndNumber: cargo?.MarksAndNumber || '',
    },
    routingInfo: {
      mode: cargo?.ModeOfTransport || '',
      vessel: apiData?.VesselName || '',
      voyage: apiData?.VoyageNo || '',
      finalDestination: getPortName(apiData?.FPD),
      portOfLoading: getPortName(apiData?.POL),
      portOfDischarge: getPortName(apiData?.POD),
      etd: apiData?.ETD,
      eta: apiData?.ETA,
    },
    fclContainers,
    lclSummary: {
      noOfPackages: Number(cargo?.NoOfPackage || 0),
      grossWeight: Number(cargo?.GrossWeight || 0),
      netWeight: Number(cargo?.NetWeight || 0),
      volume: Number(cargo?.Volume || 0),
    },
    charges: chargeRows,
    chargeTotals,
    amountInWords: options?.amountInWords || '',
    signatoryName: userData?.userName || '',
  };
}
