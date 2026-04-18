import {
  DeliveryOrderChargePdfRow,
  DeliveryOrderContainerPdfRow,
  DeliveryOrderPdfData,
} from '../interfaces/pdf-document.interfaces';
import {
  formatDate,
  formatNumberWithCommas,
  joinNonEmpty,
} from '../helpers/pdf-formatters';
import { getPdfStyles } from '../styles/pdf-styles';

const RIGHT_LABEL_WIDTH = 100;
const RIGHT_COLON_WIDTH = 10;
const RIGHT_VALUE_OFFSET = RIGHT_LABEL_WIDTH + RIGHT_COLON_WIDTH;
const CONSIGNEE_VALUE_OFFSET = 20;

export function generateDeliveryOrderDocument(data: DeliveryOrderPdfData): any {
  const isFcl = (data.selectedFclLcl || '').toUpperCase() === 'FCL';

  return {
    pageSize: data.config?.pageSize || 'A4',
    pageOrientation: 'portrait',
    pageMargins: [15, 10, 15, 28],
    background: (_: number, pageSize: any) => ({
      canvas: [
        {
          type: 'rect',
          x: 14,
          y: 14,
          w: pageSize.width - 28,
          h: pageSize.height - 28,
          lineWidth: 1,
          lineColor: '#000',
        },
      ],
    }),
    content: [
      buildHeader(data),
      buildTitle(data),
      buildReleaseSection(data),
      buildShipmentHeading(),
      buildPartySection(data),
      buildNotifySection(data),
      buildOtherInfoSection(data),
      isFcl ? buildFclTable(data.fclContainers) : buildLclTable(data),
      buildDescriptionSection(data),
      buildChargesTable(data),
      buildAmountInWords(data),
      buildTermsSection(data),
      buildAgentOnlySection(data),
    ],
    footer: (currentPage: number, pageCount: number) =>
      buildFooter(data, currentPage, pageCount),
    styles: getDeliveryOrderStyles(),
    defaultStyle: {
      fontSize: 10,
      color: '#000',
    },
  };
}

function buildHeader(data: DeliveryOrderPdfData): any {
  const company: any = data.company || {};
  const branch: any = data.branch || {};
  const detailLine1 = branch?.addressLine1 || company?.addressLine1 || '';
  const detailLine2 = [
    branch?.addressLine2 || company?.addressLine2 || '',
    branch?.cityName || branch?.cityMaster?.cityName || company?.city || '',
    branch?.phoneNumber || company?.phoneNumber
      ? `Ph.no : ${branch?.phoneNumber || company?.phoneNumber}`
      : '',
  ]
    .filter(Boolean)
    .join(', ');

  return {
    table: {
      widths: [75, '*'],
      body: [
        [
          {
            border: [false, false, false, false],
            alignment: 'center',
            margin: [0, 4, 0, 4],
            stack: [
              data.logo
                ? {
                    image: data.logo,
                    fit: [55, 55],
                    alignment: 'center',
                  }
                : { text: '' },
            ],
          },
          {
            border: [false, false, false, false],
            stack: [
              {
                text: (company?.companyName || '').toUpperCase(),
                bold: true,
                fontSize: 12,
                alignment: 'right',
              },
              {
                text: branch?.branchName || '',
                bold: true,
                fontSize: 9,
                alignment: 'right',
                margin: [0, 2, 0, 0],
              },
              {
                text: detailLine1,
                fontSize: 9,
                alignment: 'right',
                margin: [0, 2, 0, 0],
              },
              {
                text: detailLine2,
                fontSize: 9,
                alignment: 'right',
                margin: [0, 2, 0, 0],
              },
            ],
            margin: [0, 6, 20, 0],
          },
        ],
      ],
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 2],
  };
}

function buildTitle(data: DeliveryOrderPdfData): any {
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
            margin: [0, 4, 0, 4],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: (i: number) => (i === 0 || i === 1 ? 1 : 0),
      vLineWidth: () => 0,
      hLineColor: () => '#000',
    },
    margin: [0, 0, 0, 6],
  };
}

function buildReleaseSection(data: DeliveryOrderPdfData): any {
  return {
    columns: [
      {
        width: '50%',
        stack: [
          { text: 'Release To', style: 'sectionLabel', margin: [6, 0, 0, 2] },
          {
            text: joinNonEmpty(
              [data.releaseTo?.name, data.releaseTo?.address],
              '\n',
            ),
            style: 'releaseValue',
            margin: [20, 0, 0, 0],
          },
        ],
      },
      {
        width: '50%',
        stack: [
          buildKeyValueRow('HBL No.', data.referenceInfo.hblNo, RIGHT_LABEL_WIDTH),
          buildKeyValueRow(
            'DO Number',
            data.referenceInfo.doNumber,
            RIGHT_LABEL_WIDTH,
          ),
          buildKeyValueRow(
            'DO Date',
            formatDate(data.referenceInfo.doDate),
            RIGHT_LABEL_WIDTH,
          ),
          buildKeyValueRow(
            'Shipment',
            data.referenceInfo.shipmentNo,
            RIGHT_LABEL_WIDTH,
          ),
        ],
        margin: [20, 0, 0, 0],
      },
    ],
    margin: [5, 0, 5, 6],
  };
}

function buildShipmentHeading(): any {
  return {
    text: 'SHIPMENT DETAILS',
    style: 'subTitle',
    margin: [10, 0, 0, 4],
  };
}

function buildPartySection(data: DeliveryOrderPdfData): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [
        [
          {
            stack: [
              { text: 'Shipper', style: 'label', margin: [0, 0, 0, 4] },
              {
                text: joinNonEmpty(
                  [data.parties.shipperName, data.parties.shipperAddress],
                  '\n',
                ),
                style: 'value',
                margin: [20, 0, 0, 0],
              },
            ],
            margin: [5, 4, 5, 4],
          },
          {
            stack: [
              { text: 'Consignee', style: 'label', margin: [0, 0, 0, 4] },
              {
                text: joinNonEmpty(
                  [data.parties.consigneeName, data.parties.consigneeAddress],
                  '\n',
                ),
                style: 'value',
                margin: [CONSIGNEE_VALUE_OFFSET, 0, 0, 0],
              },
            ],
            margin: [20, 4, 5, 4],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: (i: number, node: any) =>
        i === 0 || i === node.table.body.length ? 1 : 0,
      vLineWidth: () => 0,
      hLineColor: () => '#000',
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 2,
      paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 0],
  };
}



function buildNotifySection(data: DeliveryOrderPdfData): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [
        [
          buildPartyCell(
            'Notify Party',
            data.parties.notifyName,
            data.parties.notifyAddress,
          ),
          {
            stack: [
              {
                columns: [
                  { width: RIGHT_LABEL_WIDTH, text: 'Goods Available At', style: 'label' },
                  { width: RIGHT_COLON_WIDTH, text: ':' },
                  {
                    width: '*',
                    text: data.parties.goodsAvailableAt || '',
                    style: 'value',
                  },
                ],
              },
            ],
            border: [false, false, false, false],
            margin: [20, 4, 5, 4],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: (i: number, node: any) =>
        i === 0 || i === node.table.body.length ? 1 : 0,
      vLineWidth: () => 0,
      hLineColor: () => '#000',
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 2,
      paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 0],
  };
}

function buildOtherInfoSection(data: DeliveryOrderPdfData): any {
  const leftItems: Array<[string, string]> = [
    ['Release Type', data.releaseInfo.releaseType || ''],
    ['Order No. / Ref', data.releaseInfo.orderReference || ''],
  ];
  const rightItems: Array<[string, string]> = [
    ['Ocean Bill Of Lading', data.releaseInfo.oceanBillOfLading || ''],
    ['Commodity', data.releaseInfo.commodity || ''],
  ];

  return {
    table: {
      widths: ['50%', '50%'],
      body: [
        [
          {
            stack: leftItems.map(([label, value]) =>
              buildWrappedKeyValueRow(label, value, 90),
            ),
            border: [false, true, false, true],
            margin: [5, 3, 5, 6],
          },
          {
            stack: rightItems.map(([label, value]) =>
              buildWrappedKeyValueRow(label, value, RIGHT_LABEL_WIDTH),
            ),
            border: [false, true, false, true],
            margin: [20, 3, 5, 6],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: (i: number, node: any) =>
        i === 0 || i === node.table.body.length ? 1 : 0,
      vLineWidth: () => 0,
      hLineColor: () => '#000',
      paddingTop: () => 2,
      paddingBottom: () => 6,
    },
    margin: [0, 0, 0, 8],
  };
}

function buildFclTable(rows: DeliveryOrderContainerPdfRow[]): any {
  return {
    stack: [
      { text: 'ROUTING INFORMATION', style: 'subTitle', margin: [10, 0, 0, 4] },
      {
        table: {
          headerRows: 1,
          widths: [78, 78, 56, '*', 64, 64],
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
        layout: edgeOpenTableLayout(),
        margin: [0, 0, 0, 8],
      },
    ],
  };
}

function buildLclTable(data: DeliveryOrderPdfData): any {
  const summary = data.lclSummary || {};

  return {
    table: {
      headerRows: 1,
      widths: ['*', '*', '*', '*'],
      body: [
        [
          { text: 'No. of Package', style: 'tableHeader' },
          { text: 'Gross Weight', style: 'tableHeader' },
          { text: 'Net Weight', style: 'tableHeader' },
          { text: 'Volume', style: 'tableHeader' },
        ],
        [
          buildTextCell(summary.noOfPackages ? String(summary.noOfPackages) : ''),
          buildNumberCell(summary.grossWeight, 3),
          buildNumberCell(summary.netWeight, 3),
          buildNumberCell(summary.volume, 3),
        ],
      ],
    },
    layout: edgeOpenTableLayout(),
    margin: [0, 0, 0, 8],
  };
}

function buildDescriptionSection(data: DeliveryOrderPdfData): any {
  return {
    table: {
      widths: ['50%', '50%'],
      body: [
        [
          {
            stack: [
              { text: 'Marks And Numbers', style: 'label', margin: [0, 0, 0, 4] },
              {
                text: data.descriptionInfo.marksAndNumber || '',
                style: 'value',
                margin: [20, 0, 0, 0],
              },
            ],
            border: [false, true, false, true],
            margin: [10, 3, 10, 10],
          },
          {
            stack: [
              { text: 'Goods Description', style: 'label', margin: [0, 0, 0, 4] },
              {
                text: data.descriptionInfo.goodsDescription || '',
                style: 'value',
                margin: [20, 0, 0, 0],
              },
            ],
            border: [false, true, false, true],
            margin: [10, 3, 10, 10],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: (i: number, node: any) =>
        i === 0 || i === node.table.body.length ? 1 : 0,
      vLineWidth: () => 0,
      hLineColor: () => '#000',
      paddingTop: () => 2,
      paddingBottom: () => 6,
    },
    margin: [0, 0, 0, 8],
  };
}

function buildChargesTable(data: DeliveryOrderPdfData): any {
  return {
    table: {
      headerRows: 1,
      widths: ['*', 42, 42, 70, 70, 70],
      body: [
        [
          { text: 'Charge Description', style: 'tableHeader' },
          { text: 'Unit', style: 'tableHeader' },
          { text: 'Curr.', style: 'tableHeader' },
          { text: 'Per Unit', style: 'tableHeader' },
          { text: 'Amount', style: 'tableHeader' },
          { text: 'Local Amount', style: 'tableHeader' },
        ],
        ...data.charges.map((item) => [
          buildTextCell(item.chargeDescription),
          buildTextCell(item.unit),
          buildTextCell(item.currency),
          buildNumberCell(item.perUnit, 2),
          buildNumberCell(item.amount, 2),
          buildNumberCell(item.localAmount, 2),
        ]),
        [
          {
            text: 'Total',
            style: 'tableCellBold',
            alignment: 'right',
            colSpan: 3,
          },
          {},
          {},
          buildNumberCell(data.chargeTotals.totalPerUnit, 2, true),
          buildNumberCell(data.chargeTotals.totalAmount, 2, true),
          buildNumberCell(data.chargeTotals.totalLocalAmount, 2, true),
        ],
      ],
    },
    layout: edgeOpenTableLayout(),
    margin: [0, 0, 0, 8],
  };
}

function buildAmountInWords(data: DeliveryOrderPdfData): any {
  return {
    columns: [
      {
        width: 120,
        text: 'Amount in Words',
        style: 'label',
        margin: [15, 0, 0, 0],
      },
      { width: 10, text: ':' },
      {
        width: '*',
        text: data.amountInWords || 'Zero',
        style: 'valueBold',
      },
    ],
    margin: [0, 0, 0, 10],
  };
}

function buildTermsSection(data: DeliveryOrderPdfData): any {
  return {
    stack: [
      { text: 'Terms and Conditions', style: 'label', margin: [15, 0, 0, 4] },
      {
        ul: (data.terms || []).map((term) => ({
          text: term,
          style: 'termsItem',
        })),
        margin: [28, 0, 15, 0],
      },
    ],
  };
}

function buildAgentOnlySection(data: DeliveryOrderPdfData): any {
  return {
    alignment: 'right',
    margin: [0, 10, 40, 0],
    stack: [
      {
        text: `FOR ${data.company?.companyName || 'Company Name'} (${data.branch?.branchName || 'Company Branch'})`,
        bold: true,
        fontSize: 10,
        alignment: 'right',
      },
      {
        text: '(AS AGENTS ONLY)',
        bold: true,
        fontSize: 10,
        alignment: 'right',
      },
    ],
  };
}


function buildPartyCell(title: string, name?: string, address?: string): any {
  return {
    stack: [
      { text: title, style: 'label', margin: [0, 0, 0, 4] },
      {
        text: joinNonEmpty([name, address], '\n'),
        style: 'value',
        margin: [20, 0, 0, 0],
      },
    ],
    border: [false, false, false, false],
    margin: [5, 4, 5, 8],
  };
}

function buildKeyValueRow(label: string, value?: string, labelWidth = 120): any {
  return {
    columns: [
      { width: labelWidth, text: label, style: 'label' },
      { width: RIGHT_COLON_WIDTH, text: ':' },
      { width: '*', text: value || '', style: 'value' },
    ],
    margin: [0, 0, 0, 2],
  };
}

function buildWrappedKeyValueRow(
  label: string,
  value?: string,
  labelWidth = 90,
): any {
  return {
    columns: [
      { width: labelWidth, text: label, style: 'label' },
      { width: RIGHT_COLON_WIDTH, text: ':' },
      { width: '*', text: value || '', style: 'value' },
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

function topBorderLayout(): any {
  return {
    hLineWidth: (i: number, node: any) => {
      if (i === 0) return 1; // top border
      if (i === node.table.body.length) return 1; // bottom border
      return 0;
    },
    vLineWidth: () => 0, // no vertical lines
    hLineColor: () => '#000',

    paddingLeft: () => 10,
    paddingRight: () => 10,
    paddingTop: () => 6,
    paddingBottom: () => 6,
  };
}

function edgeOpenTableLayout(): any {
  return {
    hLineWidth: () => 1,
    vLineWidth: (i: number, node: any) =>
      i === 0 || i === node.table.widths.length ? 0 : 1,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingTop: () => 3,
    paddingBottom: () => 3,
    paddingLeft: () => 0,
    paddingRight: () => 0,
  };
}

function getDeliveryOrderStyles(): any {
  return {
    ...getPdfStyles(),
    subTitle: { fontSize: 12, bold: true },
    label: { fontSize: 10.5, bold: true },
    value: { fontSize: 10.5 },
    valueBold: { fontSize: 10.5, bold: true },
    releaseValue: { fontSize: 10.5, bold: true },
    sectionLabel: { fontSize: 11, bold: true },
    tableHeader: {
      fontSize: 9,
      bold: true,
      alignment: 'center',
    },
    tableCell: { fontSize: 9 },
    tableCellBold: { fontSize: 9, bold: true },
    termsItem: { fontSize: 9.5 },
  };
}

function buildFooter(
  data: DeliveryOrderPdfData,
  currentPage?: number,
  pageCount?: number,
): any {
  return {
    margin: [24, 0, 24, 0],
    columns: [
      {
        text: `Printed By : ${data.userData?.userName || ''}`,
        alignment: 'left',
        width: 120,
        fontSize: 8,
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
      },
      {
        text:
          currentPage && pageCount
            ? `Page ${currentPage} of ${pageCount}`
            : '',
        alignment: 'right',
        width: 60,
        fontSize: 8,
      },
    ],
  };
}

export function transformDeliveryOrderApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    masterJobContainers?: any[];
    selectedFCLLCL?: string;
    currencyList?: any[];
    uomList?: any[];
    containerTypeList?: any[];
    packageTypeList?: any[];
    terms?: any[];
    amountInWords?: string;
  },
): DeliveryOrderPdfData {
  const cargo = apiData?.Cargo?.[0] || {};
  const other = apiData?.Others?.[0] || {};
  const charges = apiData?.costRevenueCharges || [];

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
    return match?.UOMCode || match?.UOMName || '';
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

  const fclContainers: DeliveryOrderContainerPdfRow[] = (
    options?.masterJobContainers || []
  ).map((container: any) => ({
    containerNo: container?.ContainerNumber || '',
    containerType: getContainerName(container?.ContainerType),
    seal: container?.LineSeal || '',
    packageType: joinNonEmpty(
      [
        container?.NoOfPkg ? String(container.NoOfPkg) : '',
        getPackageTypeName(container?.PkgType),
      ],
      ' ',
    ),
    grossWeight: Number(container?.GrossWeight || 0),
    volume: Number(container?.Volume || 0),
  }));

  const chargeRows: DeliveryOrderChargePdfRow[] = charges.map((item: any) => ({
    chargeDescription: item?.ChargeDescription || '',
    unit: getUnitCode(item?.ChargeUomSid),
    currency: getCurrencyCode(item?.RevenueCurrencyMasterSid),
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
    reportTitle: 'Delivery Order',
    selectedFclLcl: options?.selectedFCLLCL || '',
    amountInWords: options?.amountInWords || '',
    releaseTo: {
      name: apiData?.CustomerName || '',
      address: apiData?.CustomerAddress || '',
    },
    referenceInfo: {
      hblNo: apiData?.HBLNo || '',
      doNumber: other?.DONo || '',
      doDate: other?.DODate,
      shipmentNo: apiData?.ShipmentNo || '',
    },
    parties: {
      shipperName: apiData?.ShipperName || '',
      shipperAddress: apiData?.ShipperAddress || '',
      consigneeName: apiData?.ConsigneeName || '',
      consigneeAddress: apiData?.ConsigneeAddress || '',
      notifyName: apiData?.Notify || '',
      notifyAddress: apiData?.NotifyAddress || '',
      goodsAvailableAt: other?.YardCFS || '',
    },
    releaseInfo: {
      releaseType: other?.ReleaseType || '',
      orderReference: other?.CustomerRefNo || '',
      oceanBillOfLading: apiData?.masterJob?.MBLNo || apiData?.MBLNo || '',
      commodity: apiData?.Products?.[0]?.ProductName || '',
    },
    fclContainers,
    lclSummary: {
      noOfPackages: Number(cargo?.NoOfPackage || 0),
      grossWeight: Number(cargo?.GrossWeight || 0),
      netWeight: Number(cargo?.NetWeight || 0),
      volume: Number(cargo?.Volume || 0),
    },
    descriptionInfo: {
      marksAndNumber: cargo?.MarksAndNumber || '',
      goodsDescription: cargo?.CommodityDescription || '',
    },
    charges: chargeRows,
    chargeTotals,
    terms: (options?.terms || [])
      .map((item: any) => item?.TandC || '')
      .filter(Boolean),
  };
}
