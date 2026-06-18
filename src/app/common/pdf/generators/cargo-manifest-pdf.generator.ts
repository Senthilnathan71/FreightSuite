import { formatDate } from '../helpers/pdf-formatters';

export function generateCargoManifestDocument(data: any): any {
  const isSeaMode = data?.selectedFCLLCL === 'FCL' || data?.selectedFCLLCL === 'LCL';
  const reportTitle = data?.title || 'Cargo Manifest';

  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [18, 16, 18, 34],
    background: (_currentPage: number, pageSize: any) => ({
      canvas: [
        {
          type: 'rect',
          x: 10,
          y: 10,
          w: pageSize.width - 20,
          h: pageSize.height - 20,
          lineWidth: 0.25,
          lineColor: '#000'
        }
      ]
    }),
    content: [
      { stack: buildFirstPage(data, isSeaMode, reportTitle), pageBreak: 'after' },
      { stack: buildSecondPage(data, isSeaMode, reportTitle) }
    ],
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    defaultStyle: {
      fontSize: 9,
      color: '#000'
    }
  };
}

function buildFirstPage(data: any, isSeaMode: boolean, reportTitle: string): any[] {
  const job = data?.masterJobData || {};
  const voyages = job?.voyages?.[0] || {};
  const others = job?.others?.[0] || {};

  const blocks: any[] = [
    buildHeader(data),
    buildTitle(reportTitle),
    {
      table: {
        widths: ['50%', '50%'],
        body: [[
          {
            stack: [
              { text: 'Agent', bold: true, margin: [0, 0, 0, 2] },
              { text: getAgentName(data, job?.DestinationAgent), margin: [20, 0, 0, 0] },
              { text: job?.DestinationAgentAddress || '', margin: [20, 0, 0, 0] }
            ],
            margin: [8, 4, 8, 4]
          },
          {
            stack: [
              infoLine('Job No.', job?.MasterJobNumber, 60),
              infoLine(isSeaMode ? 'MBL No.' : 'MAWB', job?.MBLNo, 60),
              infoLine('MBL Date', formatDate(job?.MBLDate), 60)
            ],
            margin: [8, 4, 8, 4]
          }
        ]]
      },
      layout: simpleBorderLayout(),
      margin: [0, 0, 0, 0]
    },
    {
      table: {
        widths: ['50%', '50%'],
        body: [[
          {
            stack: [
              { text: 'Originating Agent', bold: true, margin: [0, 0, 0, 2] },
              { text: getAgentName(data, job?.OriginAgent), margin: [20, 0, 0, 0] },
              { text: getAgentAddress(data, job?.OriginAgent), margin: [20, 0, 0, 0] }
            ],
            margin: [8, 4, 8, 4]
          },
          {
            stack: [
              { text: 'Freight Depot', bold: true, margin: [0, 0, 0, 2] },
              { text: getYardName(data, others?.Yard), margin: [20, 0, 0, 0] },
              { text: others?.YardAddress || '', margin: [20, 0, 0, 0] }
            ],
            margin: [8, 4, 8, 4]
          }
        ]]
      },
      layout: simpleBorderWithoutTopLayout(),
      margin: [0, 0, 0, 0]
    },
    {
      table: {
        widths: ['50%', '50%'],
        body: [[
          {
            stack: [
              infoLine(isSeaMode ? 'Vessel' : 'Flight', `${voyages?.VesselName || ''} ${voyages?.VoyageNo || ''}`.trim(), 70),
              infoLine('POL', getPortName(data, job?.POL), 70),
              infoLine('POD', getPortName(data, job?.POD), 70),
              infoLine('ETD', formatDate(voyages?.ETD), 70),
              infoLine('ETA', formatDate(voyages?.ETA), 70)
            ],
            margin: [8, 4, 8, 4]
          },
          {
            stack: [
              infoLine('Carrier', voyages?.CarrierName || '', 70),
              infoLine('Carrier Ref.', others?.CarrierRef || '', 70),
              infoLine('Agents Ref.', others?.AgentRef || '', 70),
              infoLine(isSeaMode ? 'Package' : 'Chargeable Wt.', isSeaMode ? (job?.NoOfPkg ?? '') : number3(job?.ChargeableWeight ?? ''), 70),
              infoLine('Gross Wt.', number3(job?.GrossWeight), 70),
              infoLine('Volume', number3(job?.Volume), 70)
            ],
            margin: [8, 4, 8, 4]
          }
        ]]
      },
      layout: simpleBorderWithoutTopLayout(),
      margin: [0, 0, 0, 8]
    }
  ];

  if (isSeaMode) {
    blocks.push(buildPageOneContainerTable(data));
  }

  return blocks;
}

function buildSecondPage(data: any, isSeaMode: boolean, reportTitle: string): any[] {
  const job = data?.masterJobData || {};
  const voyages = job?.voyages?.[0] || {};

  const blocks: any[] = [
    buildHeader(data),
    buildTitle(reportTitle),
    {
      table: {
        widths: ['33.33%', '33.33%', '33.34%'],
        body: [[
          {
            stack: [
              infoLine('Manifest No.', job?.MasterJobNumber, 85),
              infoLine('Manifest Date', formatDate(job?.MasterJobDate), 85),
              infoLine(isSeaMode ? 'Vessel' : 'Flight No', voyages?.VesselName || '', 85),
              infoLine(isSeaMode ? 'Voyage No' : 'Flight Name', voyages?.VoyageNo || '', 85),
              infoLine('ETD', formatDate(voyages?.ETD), 85)
            ],
            margin: [8, 4, 8, 4],
            border:[true,true,false,true]
          },
          {
            stack: [
              infoLine('Booking No.', job?.allShipments?.[0]?.BookingNo || '', 85),
              infoLine(isSeaMode ? 'MBL No.' : 'MAWB', job?.MBLNo || '', 85),
              infoLine('MBL Date', formatDate(job?.MBLDate), 85),
              ...(isSeaMode ? [infoLine('Sailing Date', formatDate(voyages?.ATA), 85)] : []),
              infoLine('ETA', formatDate(voyages?.ETA), 85)
            ],
            margin: [8, 4, 8, 4],
            border:[false,true,false,true]
          },
          {
            stack: [
              infoLine('Load Port', getPortName(data, job?.POL), 85),
              infoLine('Discharge Port', getPortName(data, job?.POD), 85),
              infoLine('Delivery Port', getPortName(data, job?.FPD), 85),
              infoLine('Master PP/CC', job?.FreightPPCC || '', 85)
            ],
            margin: [8, 4, 8, 4],
            border:[false,true,true,true]
          }
        ]]
      },
      layout: simpleBorderLayout(),
      margin: [0, 0, 0, 8]
    }
  ];

  if (isSeaMode) {
    blocks.push(buildPageTwoContainerTable(data));
  }

  blocks.push(buildHouseCargoTable(data));
  return blocks;
}

function buildPageOneContainerTable(data: any): any {
  const rows = (data?.masterJobData?.containers || []).map((c: any) => ([
    c?.ContainerNumber || '',
    c?.LineSeal || '',
    getContainerSize(data, c?.ContainerType),
    { text: number3(getTareWeight(data, c?.ContainerType)), alignment: 'right' },
    { text: number3(c?.GrossWeight), alignment: 'right' },
    { text: number3(c?.Volume), alignment: 'right' },
    { text: String(c?.NoOfPkg ?? 0), alignment: 'right' }
  ]));

  rows.push([
    '',
    '',
    '',
    { text: 'Total', bold: true, alignment: 'right' },
    { text: number3(getTotalContainerGrossWeight(data)), bold: true, alignment: 'right' },
    { text: number3(getTotalContainerVolume(data)), bold: true, alignment: 'right' },
    { text: String(getTotalContainerPackages(data)), bold: true, alignment: 'right' }
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ['18%', '14%', '12%', '14%', '14%', '14%', '14%'],
      body: [
        [
          { text: 'Container', bold: true, alignment: 'center' },
          { text: 'Seal', bold: true, alignment: 'center' },
          { text: 'Size', bold: true, alignment: 'center' },
          { text: 'Tare Wt.', bold: true, alignment: 'center' },
          { text: 'Gross Wt.', bold: true, alignment: 'center' },
          { text: 'Volume', bold: true, alignment: 'center' },
          { text: 'Packages', bold: true, alignment: 'center' }
        ],
        ...rows
      ]
    },
    layout: tableBorderLayout(),
    margin: [0, 0, 0, 0]
  };
}

function buildPageTwoContainerTable(data: any): any {
  const rows = (data?.masterJobData?.containers || []).map((c: any) => ([
    c?.ContainerNumber || '',
    getContainerTypeName(data, c?.ContainerType) || '',
    c?.IsSoc || '',
    c?.LineSeal || ''
  ]));

  return {
    table: {
      headerRows: 1,
      widths: ['28%', '34%', '14%', '24%'],
      body: [
        [
          { text: 'Container No.', bold: true, alignment: 'center' },
          { text: 'Container Type', bold: true, alignment: 'center' },
          { text: 'SOC Container', bold: true, alignment: 'center' },
          { text: 'Seal', bold: true, alignment: 'center' }
        ],
        ...rows
      ]
    },
    layout: tableBorderLayout(),
    margin: [0, 0, 0, 8]
  };
}

function buildHouseCargoTable(data: any): any {
  const houseJobs = data?.masterJobData?.houseJob || [];
  const body: any[] = [[
    { text: 'SNo.', bold: true, alignment: 'center' },
    { text: 'HBL No.', bold: true, alignment: 'center' },
    { text: 'Shipper/ Consignee / Notify', bold: true, alignment: 'center' },
    { text: 'Marks & No.', bold: true, alignment: 'center' },
    { text: 'Pkg & Desc', bold: true, alignment: 'center' },
    { text: 'Weight', bold: true, alignment: 'center' },
    { text: 'Vol', bold: true, alignment: 'center' },
    { text: 'PP/CC', bold: true, alignment: 'center' },
    { text: 'AMS Ref No.', bold: true, alignment: 'center' },
    { text: 'Service', bold: true, alignment: 'center' }
  ]];

  houseJobs.forEach((h: any, i: number) => {
    const cargoList = h?.Cargo || [];
    const firstCargo = cargoList[0] || {};
    body.push([
      { text: String(i + 1), alignment: 'center' },
      { text: h?.HBLNo || '', noWrap: true },
      {
        text: `Shipper: ${h?.ShipperName || ''}\nConsignee: ${h?.ConsigneeName || ''}\nNotify: ${h?.Notify || ''}`
      },
      firstCargo?.MarksAndNumber || '',
      `${getHousePackages(h) || ''} Pkg\n${firstCargo?.CommodityDescription || ''}`,
      { text: number3(getHouseGrossWeight(h)), alignment: 'right' },
      { text: number3(getHouseVolume(h)), alignment: 'right' },
      h?.FreightTerms || '',
      '',
      firstCargo?.ShipmentTerms || ''
    ]);
  });

  body.push([
    { text: 'Total', colSpan: 4, alignment: 'right', bold: true },
    {},
    {},
    {},
    { text: String(getTotalPackages(data)), alignment: 'right', bold: true },
    { text: number3(getTotalHouseGrossWeight(data)), alignment: 'right', bold: true },
    { text: number3(getTotalHouseVolume(data)), alignment: 'right', bold: true },
    { text: '', colSpan: 3 },
    {},
    {}
  ]);

  return {
    table: {
      headerRows: 1,
      widths: ['4%', '14%', '20%', '13%', '8%', '8%', '7%', '8%', '10%', '8%'],
      body
    },
    layout: tableBorderLayout(),
    margin: [0, 0, 2, 0]
  };
}

function buildHeader(data: any): any {
  const company = data?.currentCompany || {};
  const branch = data?.currentBranch || {};
  const logo = data?.logo;
  const printSettings = data?.printSettings || {
    logoPosition: 'left' as const,
    companyPosition: 'center' as const,
    companyAlignment: 'center' as const
  };
  const line1 = branch?.addressLine1 || company?.addressLine1 || '';
  const city = branch?.cityMaster?.cityName || branch?.cityName || company?.city || '';
  const postalCode = branch?.postalCode || company?.postalCode || '';
  const phone = branch?.phoneNumber || company?.phoneNumber || '';
  const cityLine: any[] = [];
  const appendText = (text: string | any[]) => {
    if (cityLine.length) cityLine.push({ text: ', ' });
    if (Array.isArray(text)) {
      cityLine.push(...text);
    } else {
      cityLine.push({ text });
    }
  };

  if (branch?.addressLine2 || company?.addressLine2) appendText(branch?.addressLine2 || company?.addressLine2);
  if (city) appendText(city);
  if (postalCode) appendText([{ text: 'Postal Code : ', bold: true }, { text: postalCode }]);
  if (phone) appendText([{ text: 'Ph.no\u00a0:\u00a0', bold: true }, { text: phone }]);

  const companyInfoStack: any[] = [
    { text: (company?.companyName || '').toUpperCase(), bold: true, fontSize: 15, alignment: printSettings.companyAlignment },
    { text: branch?.branchName || '', bold: true, fontSize: 12, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: line1, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: cityLine, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] }
  ];

  const buildSlot = (slot: 'left' | 'center' | 'right') => {
    const stack: any[] = [];
    if (printSettings.logoPosition === slot && logo) {
      stack.push({ image: logo, fit: [72, 56], alignment: slot, margin: slot === 'right' ? [0, 0, 8, 0] : [8, 0, 0, 0] });
    }
    if (printSettings.companyPosition === slot) {
      const margin = slot === 'right'
        ? (stack.length ? [0, 4, 18, 0] : [0, 0, 18, 0])
        : (stack.length ? [0, 4, 0, 0] : [0, 0, 0, 0]);
      stack.push({ stack: companyInfoStack, margin });
    }

    return { stack };
  };

  return {
    stack: [
      {
        table: {
          widths: getHeaderWidths(printSettings.logoPosition, printSettings.companyPosition),
          body: [[
            buildSlot('left'),
            buildSlot('center'),
            buildSlot('right')
          ]]
        },
        layout: 'noBorders'
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 805, y2: 0, lineWidth: 0.1 }],
        margin: [0, 5, 0, 0]
      }
    ],
    margin: [0, 0, 0, 6]
  };
}

function getHeaderWidths(
  logoPosition: 'left' | 'center' | 'right',
  companyPosition: 'left' | 'center' | 'right'
): any[] {
  if (companyPosition === 'center' && logoPosition !== 'center') {
    return [110, '*', 110];
  }

  if (companyPosition === 'right' && logoPosition === 'left') {
    return [110, '*', 300];
  }

  if (companyPosition === 'left' && logoPosition === 'right') {
    return [300, '*', 110];
  }

  return ['33%', '34%', '33%'];
}

function buildTitle(title: string): any {
  return {
    text: title,
    alignment: 'center',
    bold: true,
    fontSize: 14,
    margin: [0, 0, 0, 8]
  };
}

function buildFooter(data: any, currentPage: number, pageCount: number): any {
  return {
    margin: [18, 0, 18, 10],
    columns: [
      { text: `Printed By : ${data?.userData?.userName || ''}`, alignment: 'left', width: '30%', fontSize: 8 },
      { text: 'This document is computer-generated and does not require a signature.', alignment: 'center', width: '45%', fontSize: 8 },
      {text:`Printed On : ${formatDate(data?.currentDate)}`, alignment: 'right', width: '15%', fontSize: 8 },
      { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', width: '10%', fontSize: 8, bold: true }
    ]
  };
}

function infoLine(label: string, value: any, labelWidth = 80): any {
  return {
    columns: [
      { text: label, width: labelWidth, bold: true },
      { text: ':', width: 8 },
      { text: value ?? '', width: '*' }
    ],
    margin: [0, 0, 0, 2]
  };
}

function simpleBorderLayout(): any {
  return {
    hLineWidth: () => 0.1,
    vLineWidth: () => 0.1,
    hLineColor: () => '#000',
    vLineColor: () => '#000'
  };
}

function simpleBorderWithoutTopLayout(): any {
  return {
    ...simpleBorderLayout(),
    hLineWidth: (i: number) => (i === 0 ? 0 : 0.1)
  };
}

function tableBorderLayout(): any {
  return {
    hLineWidth: () => 0.1,
    vLineWidth: () => 0.1,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingLeft: () => 3,
    paddingRight: () => 3,
    paddingTop: () => 2,
    paddingBottom: () => 2
  };
}

function getAgentName(data: any, sid: number): string {
  if (!sid) return '';
  const agent = (data?.agentList || []).find((a: any) => a?.CustomerMasterSid === sid);
  return agent?.CustomerName || '';
}

function getAgentAddress(data: any, sid: number): string {
  if (!sid) return '';
  const agent = (data?.agentList || []).find((a: any) => a?.CustomerMasterSid === sid);
  return agent?.Address || '';
}

function getYardName(data: any, sid: number): string {
  if (!sid) return '';
  const yard = (data?.yardList || []).find((y: any) => y?.CustomerMasterSid === sid);
  return yard?.CustomerName || '';
}

function getPortName(data: any, code: string): string {
  if (!code) return '';
  const port = (data?.portList || []).find((p: any) => p?.PortCode === code);
  return port ? `${port.PortCode} - ${port.PortName}` : code;
}

function getContainerTypeName(data: any, sid: number): string {
  const c = (data?.containerTypeList || []).find((x: any) => +x?.ContainerTypeMasterSid === +sid);
  return c?.ContainerName || '';
}

function getContainerSize(data: any, sid: number): string {
  const c = (data?.containerTypeList || []).find((x: any) => +x?.ContainerTypeMasterSid === +sid);
  return c?.ContainerSize || '-';
}

function getTareWeight(data: any, sid: number): number {
  const c = (data?.containerTypeList || []).find((x: any) => +x?.ContainerTypeMasterSid === +sid);
  return Number(c?.TareWeight || 0);
}

function getTotalContainerPackages(data: any): number {
  return (data?.masterJobContainers || []).reduce((sum: number, c: any) => sum + (Number(c?.NoOfPkg) || 0), 0);
}

function getTotalContainerGrossWeight(data: any): number {
  return (data?.masterJobContainers || []).reduce((sum: number, c: any) => sum + (Number(c?.GrossWeight) || 0), 0);
}

function getTotalContainerVolume(data: any): number {
  return (data?.masterJobContainers || []).reduce((sum: number, c: any) => sum + (Number(c?.Volume) || 0), 0);
}

function getTotalPackages(data: any): number {
  const houseJobs = data?.masterJobData?.houseJob || [];
  return houseJobs.reduce((hSum: number, h: any) => {
    const cargo = h?.Cargo || [];
    return hSum + cargo.reduce((cSum: number, c: any) => cSum + (Number(c?.NoOfPackage) || 0), 0);
  }, 0);
}

function getHousePackages(houseJob: any): number {
  const cargo = houseJob?.Cargo || [];
  return cargo.reduce((sum: number, c: any) => sum + (Number(c?.NoOfPackage) || 0), 0);
}

function getTotalHouseGrossWeight(data: any): number {
  const houseJobs = data?.masterJobData?.houseJob || [];
  return houseJobs.reduce((hSum: number, h: any) => {
    const cargo = h?.Cargo || [];
    return hSum + cargo.reduce((cSum: number, c: any) => cSum + (Number(c?.GrossWeight) || 0), 0);
  }, 0);
}

function getHouseGrossWeight(houseJob: any): number {
  const cargo = houseJob?.Cargo || [];
  return cargo.reduce((sum: number, c: any) => sum + (Number(c?.GrossWeight) || 0), 0);
}

function getTotalHouseVolume(data: any): number {
  const houseJobs = data?.masterJobData?.houseJob || [];
  return houseJobs.reduce((hSum: number, h: any) => {
    const cargo = h?.Cargo || [];
    return hSum + cargo.reduce((cSum: number, c: any) => cSum + (Number(c?.Volume) || 0), 0);
  }, 0);
}

function getHouseVolume(houseJob: any): number {
  const cargo = houseJob?.Cargo || [];
  return cargo.reduce((sum: number, c: any) => sum + (Number(c?.Volume) || 0), 0);
}

function number3(value: any): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
