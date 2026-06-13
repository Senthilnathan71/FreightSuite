export interface HblPdfContainerRow {
  containerInfo: string;
  packageInfo: string;
  grossWeight: number;
  volume: number;
}

export interface HblPdfData {
  isDraft: boolean;
  title: string;
  billNo: string;
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  notifyName: string;
  notifyAddress: string;
  deliveryAgent: string;
  placeOfReceipt: string;
  portOfLoading: string;
  jobNo: string;
  jobRef: string;
  vesselVoyage: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  noOfBill: string;
  companyName: string;
  branchName: string;
  branchAddressLine1: string;
  branchAddressLine2: string;
  branchCityLine: string;
  logo?: string;
  containers: HblPdfContainerRow[];
  totalGrossWeight: number;
  totalVolume: number;
  totalContainers: string;
  onboardDate: string;
  carrierSignCompany: string;
  printedBy: string;
  printedOn: string;
}

function fmtNum(value: any, digits: number = 3): string {
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtDate(value: any): string {
  if (!value) return '';

  const d = new Date(value);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); 
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

function cleanJoin(parts: any[], sep: string): string {
  return parts
    .map((p) => (p ?? '').toString().trim())
    .filter(Boolean)
    .join(sep);
}

function isSwitchBLEnabled(apiData: any): boolean {
  const switchBL =
    apiData?.Others?.[0]?.SwitchBL ??
    apiData?.houseJobProxy?.[0]?.SwitchBL ??
    apiData?.HouseJobProxy?.[0]?.SwitchBL ??
    apiData?.Proxy?.[0]?.SwitchBL ??
    apiData?.SwitchBL;

  return String(switchBL || '').toUpperCase() === 'Y';
}

function getProxyPrintData(apiData: any): any {
  return (
    apiData?.HouseJobProxy?.[0] ||
    apiData?.houseJobProxy?.[0] ||
    apiData?.Proxy?.[0] ||
    apiData?.Others?.[0] ||
    null
  );
}

function pickPrintValue(apiData: any, primaryValue: any, proxyValue: any): string {
  const hasProxyValue =
    proxyValue !== null &&
    proxyValue !== undefined &&
    String(proxyValue).trim() !== '';

  const value = isSwitchBLEnabled(apiData)
    ? (hasProxyValue ? proxyValue : primaryValue)
    : primaryValue;
  return value === null || value === undefined ? '' : String(value);
}

function lineLayout(padding: number = 4): any {
  return {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingLeft: () => padding,
    paddingRight: () => padding,
    paddingTop: () => padding,
    paddingBottom: () => padding,
  };
}

export function generateHblDocument(data: HblPdfData): any {
  const declarationText = `RECEIVED by the Carrier the Goods as specified above in appearent good order and condition unless otherwise stated, to be transported to such place as agreed, authorised or permitted herein and subject to all the terms and conditions appearing on the fornt and reverse of the Bill of Lading to which the Merchant agrees by accepting this Bills of Lading, any local privileges and customs notwithstanding. The particulars given above as stated by the shipper and the weight, measure, quantity, condition, contents and value of the Goods are unknown to the Carrier In WITNESS whenreof one (1) original Bill of Lading has been signed if not otherwise stated above, the same being accomplished the other(s). If any, to be void, it required by the Carrier one (1) original Bill of Lading must be surrendered duty andorsed in exchange fo the Goods or delivery order`;

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [14, 12, 14, 12],
    defaultStyle: {
      fontSize: 9,
    },
    background: data.isDraft
      ? (currentPage: number, pageSize: any) => {
          if (currentPage !== 1) return null;
          return {
            canvas: [
              {
                type: 'rect',
                x: 10,
                y: 10,
                w: pageSize.width - 20,
                h: pageSize.height - 20,
                lineWidth: 0.5,
                lineColor: '#000',
              },
            ],
          };
        }
      : undefined,
    content: [
      { text: data.title, bold: true, fontSize: 12, margin: [0, 0, 0, 2] },
      buildFixedBottomSection(data, declarationText),

      {
        table: {
          widths: ['50%', '50%'],
          heights: [50],
          body: [
            [
              {
                stack: [
                  { text: 'Shipper', bold: true, margin: [0, 0, 0, 2] },
                  { text: data.shipperName || '', margin: [20, 0, 0, 0] },
                  { text: data.shipperAddress || '', margin: [20, 0, 0, 0] },
                ],
                border: [false, true, true, false],
                minHeight: 60,
              },
              {
                stack: [
                  {
                    table: {
                      widths: [110, '*'],
                      body: [[{ text: 'Bill of Lading No.', bold: true }, { text: `: ${data.billNo || ''}` }]],
                    },
                    layout: {
                      hLineWidth: (i: number) => (i === 1 ? 0.5 : 0),
                      vLineWidth: () => 0,
                      paddingLeft: () => 0,
                      paddingRight: () => 0,
                      paddingTop: () => 0,
                      paddingBottom: () => 0,
                    },
                    margin: [-4, -4, -4, 0],
                  },
                  { text: 'Delivery Agent & Ref.', bold: true, margin: [0, 2, 0, 2] },
                  { text: data.deliveryAgent || '', margin: [20, 0, 0, 0] },
                ],
                minHeight: 60,
                border: [false, true, false, false],
              },
            ],
          ],
        },
        layout: lineLayout(),
        margin: [0, 0, 0, 0],
      },

      {
        table: {
          widths: ['50%', '50%'],
           heights: [50],
          body: [
            [
              {
                stack: [
                  {
                    table: {
                      widths: ['*'],
                       heights: [50],
                      body: [[{
                        stack: [
                          { text: 'Consignee', bold: true, margin: [0, 0, 0, 2] },
                          { text: data.consigneeName || '', margin: [20, 0, 0, 0] },
                          { text: data.consigneeAddress || '', margin: [20, 0, 0, 0] },
                        ],
                          border: [false, false, false, true],
                        minHeight: 60,
                      }]],
                    },
                    layout: lineLayout(0),
                    margin: [0, 0, 0, 0],
                  },
                  {
                    table: {
                      widths: ['*'],
                      heights: [50],
                      body: [[{
                        stack: [
                          { text: 'Notify Party', bold: true, margin: [0, 0, 0, 2] },
                          { text: data.notifyName || '', margin: [20, 0, 0, 0] },
                          { text: data.notifyAddress || '', margin: [20, 0, 0, 0] },
                        ],
                         border: [false, false, false, false],
                        minHeight: 60,
                      }]],
                    },
                    layout: lineLayout(0),
                    margin: [0, 0, 0, 0],
                  },
                ],
              },
              {
                stack: [
                  ...(data.logo
                    ? [{ image: data.logo, fit: [95, 45], alignment: 'center', margin: [0, 0, 0, 3] }]
                    : []),
                  { text: data.companyName || '', bold: true, fontSize: 11, alignment: 'center', margin: [0, 0, 0, 1] },
                  { text: data.branchName || '', bold: true, alignment: 'center', margin: [0, 0, 0, 1] },
                  { text: data.branchAddressLine1 || '', alignment: 'center', margin: [0, 0, 0, 1] },
                  { text: cleanJoin([data.branchAddressLine2, data.branchCityLine], ', '), alignment: 'center' },
                ],
                margin: [0, 8, 0, 8],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: (i: number, node: any) => {
            if (i === 0 || i === node.table.widths.length) return 0;
            return 0.5;
          },
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
        margin: [0, 0, 0, 0],
      },

      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [[
            { stack: [{ text: 'Place of Receipt', bold: true, alignment: 'center' }, { text: data.placeOfReceipt || '', alignment: 'center' }] },
            { stack: [{ text: 'Port of Loading', bold: true, alignment: 'center' }, { text: data.portOfLoading || '', alignment: 'center' }] },
            { stack: [{ text: 'Job No.', bold: true, alignment: 'center' }, { text: data.jobNo || '', alignment: 'center' }] },
            { stack: [{ text: 'Job Ref.', bold: true, alignment: 'center' }, { text: data.jobRef || '', alignment: 'center' }] },
          ]],
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 ? 0 : 0.5),
          vLineWidth: (i: number, node: any) => {
            if (i === 0 || i === node.table.widths.length) return 0;
            return 0.5;
          },
        },
        margin: [0, 0, 0, 0],
      },

      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [[
            { stack: [{ text: 'Vessel / Voyage No.', bold: true, alignment: 'center' }, { text: data.vesselVoyage || '', alignment: 'center' }] },
            { stack: [{ text: 'Port of Discharge', bold: true, alignment: 'center' }, { text: data.portOfDischarge || '', alignment: 'center' }] },
            { stack: [{ text: 'Place of Delivery', bold: true, alignment: 'center' }, { text: data.placeOfDelivery || '', alignment: 'center' }] },
            { stack: [{ text: 'No of Bill of Lading', bold: true, alignment: 'center' }, { text: data.noOfBill || '', alignment: 'center' }] },
          ]],
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 ? 0 : 0.5),
          vLineWidth: (i: number, node: any) => {
            if (i === 0 || i === node.table.widths.length) return 0;
            return 0.5;
          },
        },
        margin: [0, 0, 0, 6],
      },

      {
        table: {
          headerRows: 1,
          widths: ['32%', '*', '14%', '14%'],
          body: [
            [
              { text: 'Container No. / Seal No./ Marks&No.', bold: true, alignment: 'center' },
              { text: 'No. of Pkg / Description / Shipping Unit', bold: true, alignment: 'center' },
              { text: 'Gross Wt.', bold: true, alignment: 'center' },
              { text: 'Volume', bold: true, alignment: 'center' },
            ],
            ...data.containers.map((container) => [
              container.containerInfo || '',
              container.packageInfo || '',
              { text: fmtNum(container.grossWeight, 3), alignment: 'right' },
              { text: fmtNum(container.volume, 3), alignment: 'right' },
            ]),
            [
              { text: 'TOTAL', colSpan: 2, alignment: 'right', bold: true },
              {},
              { text: fmtNum(data.totalGrossWeight, 3), alignment: 'right', bold: true },
              { text: fmtNum(data.totalVolume, 3), alignment: 'right', bold: true },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: (i: number, node: any) => {
            if (i === 0 || i === node.table.widths.length) return 0;
            return 0.5;
          },
        },
        margin: [0, 0, 0, 0],
      },

    ],
  };
}

function buildFixedBottomSection(data: HblPdfData, declarationText: string): any {
  return {
    absolutePosition: { x: 14, y: 600 },
    width: 567,
    stack: [
      {
        table: {
          widths: ['67%', '33%'],
          body: [[
            { text: [{ text: 'Total Number of Containers SAY : ', bold: true }, `${data.totalContainers || ''}`] },
            { text: [{ text: 'OnBoard Date : ', bold: true }, data.onboardDate || ''] },
          ]],
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === node.table.body.length ? 0 : 0.5),
          vLineWidth: (i: number, node: any) => {
            if (i === 0 || i === node.table.widths.length) return 0;
            return 0.5;
          },
        },
      },
      {
        table: {
          widths: ['50%', '50%'],
          heights: [56],
          body: [[
            { text: 'Freight Details, Charges etc :', bold: true, minHeight: 56 },
            { text: 'Excess Value Declaration :', bold: true, minHeight: 56 },
          ]],
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === node.table.body.length ? 0 : 0.5),
          vLineWidth: (i: number, node: any) => {
            if (i === 0 || i === node.table.widths.length) return 0;
            return 0.5;
          },
        },
      },
      {
        table: {
          widths: ['50%', '50%'],
          body: [[
            { text: declarationText, fontSize: 8 },
            {
              stack: [
                { text: 'Signed on behalf of the Carrier.', bold: true, margin: [0, 0, 0, 2] },
                { text: `By ${data.carrierSignCompany || ''}`, margin: [0, 0, 0, 2] },
                { text: 'As Agent For the Carrier', bold: true },
              ],
            },
          ]],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: (i: number, node: any) => {
            if (i === 0 || i === node.table.widths.length) return 0;
            return 0.5;
          },
        },
        margin: [0, 0, 0, 12],
      },
      {
        columns: [
          { text: `Printed By: ${data.printedBy || ''}`, fontSize: 8 },
          { text: 'This document is computer-generated and does not require a signature.', fontSize: 8, alignment: 'center' },
          { text: `Printed On: ${data.printedOn || ''}`, fontSize: 8, alignment: 'right' },
        ],
      },
    ],
  };
}

export function transformHblApiData(
  apiData: any,
  options: {
    selectedReport?: 'HBL' | 'HBLDraft';
    hblCount?: number;
    company?: any;
    branch?: any;
    userData?: any;
    currentDate?: Date;
    currentBranchCityName?: string | null;
    agentList?: any[];
  },
  logo?: string,
): HblPdfData {
  const cargo = apiData?.Cargo || [];
  const products = (apiData?.Products || []).filter((p: any) => !!p.MasterJobContainerSid);

  const agentName = (agentSid: number): string => {
    const found = (options?.agentList || []).find((x: any) => x?.CustomerMasterSid == agentSid);
    return found?.CustomerName || '';
  };

  const rows: HblPdfContainerRow[] = products.map((rate: any) => ({
    containerInfo: cleanJoin([
      rate?.ContainerNo,
      apiData?.masterJob?.containers?.[0]?.LineSeal,
      apiData?.Cargo?.[0]?.MarksAndNumber,
    ], ' / '),
    packageInfo: cleanJoin([
      rate?.ExternlQty,
      apiData?.Cargo?.[0]?.CommodityDescription,
      rate?.ExternaPkg,
    ], ' / '),
    grossWeight: Number(rate?.GrossWeight) || 0,
    volume: Number(rate?.Volume) || 0,
  }));

  const totalGrossWeight = cargo.reduce((sum: number, item: any) => sum + (Number(item?.GrossWeight) || 0), 0);
  const totalVolume = cargo.reduce((sum: number, item: any) => sum + (Number(item?.Volume) || 0), 0);

  const isDraft = options?.selectedReport === 'HBLDraft';
  const titleSuffix = isDraft
    ? ''
    : ((options?.hblCount || 0) > 0 ? 'COPY' : (apiData?.Others?.[0]?.ReleaseType || ''));

  const title = isDraft ? 'House Bill of Lading' : `House Bill of Lading - ${titleSuffix}`.trim();

  const branchCityLine = cleanJoin([
    options?.currentBranchCityName || options?.branch?.cityMaster?.cityName,
    options?.branch?.postalCode || options?.branch?.ZipCode,
    options?.branch?.phoneNumber || options?.branch?.Phone,
  ], ', ');
  const proxyPrintData = getProxyPrintData(apiData);

  return {
    isDraft,
    title,
    billNo: apiData?.HBLNo || '',
    shipperName: pickPrintValue(apiData, apiData?.ShipperName, proxyPrintData?.ShipperName),
    shipperAddress: pickPrintValue(apiData, apiData?.ShipperAddress, proxyPrintData?.ShipperAddress),
    consigneeName: pickPrintValue(apiData, apiData?.ConsigneeName, proxyPrintData?.ConsigneeName),
    consigneeAddress: pickPrintValue(apiData, apiData?.ConsigneeAddress, proxyPrintData?.ConsigneeAddress),
    notifyName: apiData?.Notify || '',
    notifyAddress: apiData?.NotifyAddress || '',
    deliveryAgent: isSwitchBLEnabled(apiData)
      ? cleanJoin([proxyPrintData?.AgentName || proxyPrintData?.DestinationAgentName, proxyPrintData?.AgentAddress], '\n')
      : agentName(apiData?.DestinationAgent),
    placeOfReceipt: apiData?.POO || '',
    portOfLoading: apiData?.POL || '',
    jobNo: apiData?.HBLNo || '',
    jobRef: apiData?.Others?.[0]?.CustomerRefNo || '',
    vesselVoyage: cleanJoin([apiData?.VesselName, apiData?.VoyageNo], ' '),
    portOfDischarge: apiData?.POD || '',
    placeOfDelivery: apiData?.Others?.[0]?.DeliveryPlace || '',
    noOfBill: (apiData?.masterJob?.NoofOriginal ?? '').toString(),
    companyName: options?.company?.companyName || '',
    branchName: options?.branch?.branchName || '',
    branchAddressLine1: options?.branch?.addressLine1 || '',
    branchAddressLine2: options?.branch?.addressLine2 || '',
    branchCityLine,
    logo,
    containers: rows,
    totalGrossWeight,
    totalVolume,
    totalContainers: (apiData?.Cargo?.[0]?.NoofContainers ?? '').toString(),
    onboardDate: fmtDate(apiData?.masterJob?.others?.[0]?.SOBDate),
    carrierSignCompany: options?.company?.companyName || '',
    printedBy: options?.userData?.userName || '',
    printedOn: fmtDate(options?.currentDate || new Date()),
  };
}
