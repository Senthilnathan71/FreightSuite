export interface MblPdfContainerRow {
  containerInfo: string;
  packageInfo: string;
  grossWeight: number;
  volume: number;
}

export interface MblPdfData {
  isDraft: boolean;
  title: string;
  mblNo: string;
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  notifyName: string;
  notifyAddress: string;
  deliveryAgent: string;
  deliveryAgentAddress: string;
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
  containers: MblPdfContainerRow[];
  totalGrossWeight: number;
  totalVolume: number;
  totalContainers: number;
  onboardDate: string;
  freightDetails: string;
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
  const month = String(d.getMonth() + 1).padStart(2, '0'); // ✅ always number
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}
function cleanJoin(parts: any[], sep: string): string {
  return parts
    .map((p) => (p ?? '').toString().trim())
    .filter(Boolean)
    .join(sep);
}

function lineLayout(): any {
  return {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 4,
    paddingBottom: () => 4,
  };
}

export function generateMblDocument(data: MblPdfData): any {
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
                lineWidth: 1,
                lineColor: '#000',
              },
            ],
          };
        }
      : undefined,
    content: [
      { text: data.title, bold: true, fontSize: 12, margin: [0, 0, 0, 2] },

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
                      widths: [100, '*'],
                      body: [
                        [
                          {
                            text: 'MBL No.',
                            bold: true,
                            border: [false, false, false, true],
                          },
                          {
                            text: `: ${data.mblNo || ''}`,
                            border: [false, false, false, true],
                          },
                        ],
                      ],
                    },
                    layout: {
                      hLineWidth: (i) => (i === 1 ? 1 : 0),
                      vLineWidth: () => 0,
                      paddingLeft: () => 0,
                    },
                  },
                  {
                    text: 'Delivery Agent & Ref.',
                    bold: true,
                    margin: [0, 0, 0, 2],
                  },
                  { text: data.deliveryAgent || '', margin: [20, 0, 0, 0] },
                  {
                    text: data.deliveryAgentAddress || '',
                    margin: [20, 0, 0, 0],
                  },
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
                      body: [
                        [
                          {
                            stack: [
                              {
                                text: 'Consignee',
                                bold: true,
                                margin: [0, 0, 0, 2],
                              },
                              {
                                text: data.consigneeName || '',
                                margin: [20, 0, 0, 0],
                              },
                              {
                                text: data.consigneeAddress || '',
                                margin: [20, 0, 0, 0],
                              },
                            ],
                            border: [false, false, false, true],
                            minHeight: 60,
                          },
                        ],
                      ],
                    },
                    layout: lineLayout(),
                    margin: [0, 0, 0, 0],
                  },
                  {
                    table: {
                      widths: ['*'],
                      heights: [50],
                      body: [
                        [
                          {
                            stack: [
                              {
                                text: 'Notify Party',
                                bold: true,
                                margin: [0, 0, 0, 2],
                              },
                              {
                                text: data.notifyName || '',
                                margin: [20, 0, 0, 0],
                              },
                              {
                                text: data.notifyAddress || '',
                                margin: [20, 0, 0, 0],
                              },
                            ],
                            border: [false, false, false, false],
                            minHeight: 60,
                          },
                        ],
                      ],
                    },
                    layout: lineLayout(),
                    margin: [0, 0, 0, 0],
                  },
                ],
              },
              {
                stack: [
                  ...(data.logo
                    ? [
                        {
                          image: data.logo,
                          fit: [95, 45],
                          alignment: 'center',
                          margin: [0, 0, 0, 3],
                        },
                      ]
                    : []),
                  {
                    text: data.companyName || '',
                    bold: true,
                    fontSize: 11,
                    alignment: 'center',
                    margin: [0, 0, 0, 1],
                  },
                  {
                    text: data.branchName || '',
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 1],
                  },
                  {
                    text: data.branchAddressLine1 || '',
                    alignment: 'center',
                    margin: [0, 0, 0, 1],
                  },
                  {
                    text: cleanJoin(
                      [data.branchAddressLine2, data.branchCityLine],
                      ', ',
                    ),
                    alignment: 'center',
                  },
                ],
                margin: [0, 8, 0, 8],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function () {
            return 1;
          },
          vLineWidth: function (i, node) {
            if (i === 0 || i === node.table.widths.length) {
              return 0;
            }
            return 1;
          },
        },
        margin: [0, 0, 0, 0],
      },

      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              {
                stack: [
                  { text: 'Place of Receipt', bold: true, alignment: 'center' },
                  { text: data.placeOfReceipt || '', alignment: 'center' },
                ],
              },
              {
                stack: [
                  { text: 'Port of Loading', bold: true, alignment: 'center' },
                  { text: data.portOfLoading || '', alignment: 'center' },
                ],
              },
              {
                stack: [
                  { text: 'Job No.', bold: true, alignment: 'center' },
                  { text: data.jobNo || '', alignment: 'center' },
                ],
              },
              {
                stack: [
                  { text: 'Job Ref', bold: true, alignment: 'center' },
                  { text: data.jobRef || '', alignment: 'center' },
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function (i, node) {
            if (i === 0) return 0;
            return 1;
          },
          vLineWidth: function (i, node) {
            if (i === 0 || i === node.table.widths.length) return 0;
            return 1;
          },
        },
        margin: [0, 0, 0, 0],
      },

      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              {
                stack: [
                  {
                    text: 'Vessel / Voyage No.',
                    bold: true,
                    alignment: 'center',
                  },
                  { text: data.vesselVoyage || '', alignment: 'center' },
                ],
              },
              {
                stack: [
                  {
                    text: 'Port of Discharge',
                    bold: true,
                    alignment: 'center',
                  },
                  { text: data.portOfDischarge || '', alignment: 'center' },
                ],
              },
              {
                stack: [
                  {
                    text: 'Place of Delivery',
                    bold: true,
                    alignment: 'center',
                  },
                  { text: data.placeOfDelivery || '', alignment: 'center' },
                ],
              },
              {
                stack: [
                  {
                    text: 'No. of Bill of Lading',
                    bold: true,
                    alignment: 'center',
                  },
                  { text: data.noOfBill || '', alignment: 'center' },
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function (i, node) {
            if (i === 0) return 0;
            return 1;
          },
          vLineWidth: function (i, node) {
            if (i === 0 || i === node.table.widths.length) return 0;
            return 1;
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
              {
                text: 'Container No. / Seal No. / Marks&No.',
                bold: true,
                alignment: 'center',
              },
              {
                text: 'No. of Pkg / Description / Shipping Unit',
                bold: true,
                alignment: 'center',
              },
              { text: 'Gross Weight', bold: true, alignment: 'center' },
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
              {
                text: fmtNum(data.totalGrossWeight, 3),
                alignment: 'right',
                bold: true,
              },
              {
                text: fmtNum(data.totalVolume, 3),
                alignment: 'right',
                bold: true,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function (i, node) {
            return 1; // keep top & bottom
          },
          vLineWidth: function (i, node) {
            // remove outer left & right borders
            if (i === 0 || i === node.table.widths.length) {
              return 0;
            }
            return 1; // keep inner lines
          },
        },
        margin: [0, 0, 0, 0],
      },
      {
        text: '',
        margin: [0, 0, 0, 240],
      },
      {
        table: {
          widths: ['67%', '33%'],
          body: [
            [
              {
                text: [
                  { text: 'Total Number of Containers SAY : ', bold: true },
                  `${data.totalContainers || 0}`,
                ],
              },
              {
                text: [
                  { text: 'OnBoard Date : ', bold: true },
                  data.onboardDate || '',
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function (i, node) {
            // Remove bottom border
            if (i === node.table.body.length) return 0;

            return 1; // keep top border
          },

          vLineWidth: function (i, node) {
            // remove outer left & right borders
            if (i === 0 || i === node.table.widths.length) {
              return 0;
            }
            return 1; // keep middle vertical line
          },
        },

        margin: [0, 0, 0, 0],
      },

      {
        table: {
          widths: ['50%', '50%'],
          heights: [56],
          body: [
            [
              {
                stack: [
                  {
                    text: 'Freight Details, Charges etc :',
                    bold: true,
                    margin: [0, 0, 0, 3],
                  },
                  // { text: data.freightDetails || '' },
                ],
                minHeight: 56,
              },
              {
                text: [{ text: 'Excess Value Declaration :', bold: true }],
                minHeight: 56,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function (i, node) {
            // Remove bottom border
            if (i === node.table.body.length) return 0;

            return 1; // keep top border
          },

          vLineWidth: function (i, node) {
            // remove outer left & right borders
            if (i === 0 || i === node.table.widths.length) {
              return 0;
            }
            return 1; // keep middle vertical line
          },
        },
        margin: [0, 0, 0, 0],
      },

      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: declarationText, fontSize: 8 },
              {
                stack: [
                  {
                    text: [
                      { text: 'Signed on behalf of the Carrier ', bold: true },
                      { text: `By ${data.carrierSignCompany || ''}` },
                    ],
                    margin: [0, 0, 0, 2],
                  },
                  { text: 'As Agent For the Carrier', bold: true },
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function () {
            return 1; // keep top & bottom borders
          },
          vLineWidth: function (i, node) {
            // remove outer left & right borders only
            if (i === 0 || i === node.table.widths.length) {
              return 0;
            }
            return 1; // keep inner vertical line
          },
        },

        margin: [0, 0, 0, 18],
      },

      {
        columns: [
          { text: `Printed By: ${data.printedBy || ''}`, fontSize: 8 },
          {
            text: 'This document is computer-generated and does not require a signature.',
            fontSize: 8,
            alignment: 'center',
          },
          {
            text: `Printed On: ${data.printedOn || ''}`,
            fontSize: 8,
            alignment: 'right',
          },
        ],
      },
    ],
  };
}

export function transformMblApiData(
  apiData: any,
  options: {
    selectedReport?: 'MBL' | 'MBLDraft';
    company?: any;
    branch?: any;
    userData?: any;
    currentDate?: Date;
    currentBranchCityName?: string | null;
    packageTypeList?: any[];
    agentList?: any[];
  },
  logo?: string,
): MblPdfData {
  const shipment = apiData?.allShipments?.[0] || {};
  const houseJob = apiData?.houseJob?.[0] || apiData?.houseJob || {};
  const others = houseJob?.Others?.[0] || apiData?.houseJob?.Others?.[0] || {};
  const voyage = apiData?.voyages?.[0] || {};
  const containers = apiData?.containers || [];

  const packageTypeName = (pkgTypeSid: number): string => {
    if (!pkgTypeSid) return '';
    const found = (options?.packageTypeList || []).find(
      (x: any) => x?.UOMMasterSid === pkgTypeSid,
    );
    return found?.UOMName || '';
  };

  const agentName = (agentSid: number): string => {
    const found = (options?.agentList || []).find(
      (x: any) => x?.CustomerMasterSid === agentSid,
    );
    return found?.CustomerName || '';
  };

  const containerRows: MblPdfContainerRow[] = containers.map(
    (container: any) => ({
      containerInfo: cleanJoin(
        [container?.ContainerNumber, container?.LineSeal],
        ' / ',
      ),
      packageInfo: cleanJoin(
        [
          container?.NoOfPkg,
          container?.CommodityDescription,
          packageTypeName(apiData?.containers?.[0]?.PkgType),
        ],
        ' / ',
      ),
      grossWeight: Number(container?.GrossWeight) || 0,
      volume: Number(container?.Volume) || 0,
    }),
  );

  const isDraft = options?.selectedReport === 'MBLDraft';
  const title = isDraft
    ? 'Master Bill of Lading'
    : `Master Bill of Lading - ${apiData?.BLReleaseType || ''}`.trim();

  const freightDetails = (apiData?.costRevenueCharges || [])
    .filter((x: any) => x?.ChargeMasterSid || x?.ChargeDescription)
    .map((x: any) => {
      const chargeName =
        x?.ChargeDescription ||
        x?.chargeMaster?.ChargeName ||
        x?.chargeMaster?.chargeName ||
        '';
      const amount = Number(x?.RevenueAmount || 0);
      const ppcc = x?.RevenuePrepaidCollect
        ? ` (${x.RevenuePrepaidCollect})`
        : '';
      return `${chargeName}: ${amount.toFixed(2)}${ppcc}`;
    })
    .join('\n');

  const totalGrossWeight = containerRows.reduce(
    (sum, x) => sum + (Number(x.grossWeight) || 0),
    0,
  );
  const totalVolume = containerRows.reduce(
    (sum, x) => sum + (Number(x.volume) || 0),
    0,
  );

  const branchCityLine = cleanJoin(
    [
      options?.currentBranchCityName || options?.branch?.cityMaster?.cityName,
      options?.branch?.postalCode,
      options?.branch?.phoneNumber,
    ],
    ', ',
  );

  return {
    isDraft,
    title,
    mblNo: apiData?.MBLNo || '',
    shipperName: shipment?.ShipperName || '',
    shipperAddress: shipment?.ShipperAddress || '',
    consigneeName: shipment?.ConsigneeName || '',
    consigneeAddress: shipment?.ConsigneeAddress || '',
    notifyName: houseJob?.Notify || '',
    notifyAddress: houseJob?.NotifyAddress || '',
    deliveryAgent: agentName(apiData?.DestinationAgent),
    deliveryAgentAddress: apiData?.DestinationAgentAddress || '',
    placeOfReceipt: apiData?.POO || '',
    portOfLoading: apiData?.POL || '',
    jobNo: apiData?.MasterJobNumber || '',
    jobRef: others?.CustomerRefNo || '',
    vesselVoyage: cleanJoin([voyage?.VesselName, voyage?.VoyageNo], ' / '),
    portOfDischarge: apiData?.POD || '',
    placeOfDelivery: others?.DeliveryPlace || '',
    noOfBill: (apiData?.NoofOriginal ?? '').toString(),
    companyName: options?.company?.companyName || '',
    branchName: options?.branch?.branchName || '',
    branchAddressLine1: options?.branch?.addressLine1 || '',
    branchAddressLine2: options?.branch?.addressLine2 || '',
    branchCityLine,
    logo,
    containers: containerRows,
    totalGrossWeight,
    totalVolume,
    totalContainers: containers.length || 0,
    onboardDate: fmtDate(apiData?.others?.[0]?.SOBDate),
    freightDetails,
    carrierSignCompany: options?.company?.companyName || '',
    printedBy: options?.userData?.userName || '',
    printedOn: fmtDate(options?.currentDate || new Date()),
  };
}
