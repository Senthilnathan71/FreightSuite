import { PdfBranchInfo, PdfCompanyInfo, PdfUserInfo } from '../interfaces/pdf-base.interface';
import { getPdfStyles } from '../styles/pdf-styles';

export interface OutturnReportPdfData {
  company: PdfCompanyInfo;
  branch: PdfBranchInfo;
  userData: PdfUserInfo;
  logo?: string;
  printSettings?: {
    logoPosition: 'left' | 'center' | 'right';
    companyPosition: 'left' | 'center' | 'right';
    companyAlignment: 'left' | 'center' | 'right';
  };
  orientation?: 'portrait' | 'landscape';
  reportTitle: string;
  params?: any;
  fullData?: any;
  masters: any[];
}

export function transformOutturnReportData(
  rawData: any,
  company: PdfCompanyInfo,
  branch: PdfBranchInfo,
  userData: PdfUserInfo,
  logo?: string,
  orientation: 'portrait' | 'landscape' = 'landscape',
  printSettings?: {
    logoPosition: 'left' | 'center' | 'right';
    companyPosition: 'left' | 'center' | 'right';
    companyAlignment: 'left' | 'center' | 'right';
  }
): OutturnReportPdfData {
  const fullData = rawData || {};

  return {
    company,
    branch,
    userData,
    logo,
    printSettings: printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
    orientation,
    reportTitle: 'OutTurn Report',
    params: fullData?.params || {},
    fullData,
    masters: normalizeArray(fullData?.data)
  };
}

export function generateOutturnReportDocument(data: OutturnReportPdfData): any {
  const content: any[] = [];

  // Every container is its own page: the info block describes that container,
  // and the table lists only its HBLs.
  const containerBlocks: Array<{ master: any; container: any }> = [];
  data.masters.forEach(master => {
    normalizeArray(master?.containers).forEach(container => {
      containerBlocks.push({ master, container });
    });
  });

  if (!containerBlocks.length) {
    content.push(buildEmptyBlock());
  } else {
    containerBlocks.forEach(({ master, container }, index) => {
      content.push({
        stack: [
          buildContainerInfo(master, container, data.params),
          buildHblTable(container)
        ],
        pageBreak: index < containerBlocks.length - 1 ? 'after' : undefined
      });
    });
  }

  return {
    pageSize: 'A4',
    pageOrientation: data.orientation || 'landscape',
    pageMargins: [18, 92, 18, 30],
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
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    content,
    styles: getStyles(),
    defaultStyle: {
      fontSize: 8,
      color: '#000'
    }
  };
}

function buildHeader(data: OutturnReportPdfData): any {
  const company = data.company;
  const branch = data.branch;
  const printSettings = data.printSettings || {
    logoPosition: 'left' as const,
    companyPosition: 'center' as const,
    companyAlignment: 'center' as const
  };
  const city = branch?.cityMaster?.cityName || branch?.cityName || company?.city || '';
  const postalCode = branch?.postalCode || company?.postalCode || '';
  const phone = branch?.phoneNumber || company?.phoneNumber || '';
  const addressLine2 = branch?.addressLine2 || company?.addressLine2 || '';
  const cityLine: any[] = [];

  const appendText = (text: string | any[]) => {
    if (cityLine.length) cityLine.push({ text: ', ' });
    if (Array.isArray(text)) {
      cityLine.push(...text);
    } else {
      cityLine.push({ text });
    }
  };

  if (addressLine2) appendText(addressLine2);
  if (city) appendText(city);
  if (postalCode) appendText([{ text: 'Postal Code : ', bold: true }, { text: postalCode }]);
  if (phone) appendText([{ text: 'Ph.no : ', bold: true }, { text: phone }]);

  const companyInfoStack: any[] = [
    { text: (company?.companyName || '').toUpperCase(), style: 'headerCompany', alignment: printSettings.companyAlignment },
    { text: branch?.branchName || '', style: 'headerBranch', alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: branch?.addressLine1 || company?.addressLine1 || '', style: 'headerAddress', alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: cityLine, style: 'headerAddress', alignment: printSettings.companyAlignment, margin: [0, 2, 0, 0], noWrap: true }
  ];

  const slotAlign: Record<'left' | 'center' | 'right', 'left' | 'center' | 'right'> = {
    left: 'left',
    center: 'center',
    right: 'right'
  };

  const buildSlot = (slot: 'left' | 'center' | 'right') => {
    const stack: any[] = [];
    if (printSettings.logoPosition === slot && data.logo) {
      stack.push({ image: data.logo, fit: [50, 50], width: 56, alignment: slotAlign[slot], margin: [8, 0, 15, 0] });
    }
    if (printSettings.companyPosition === slot) {
      const companyMargin = slot === 'right'
        ? (stack.length ? [0, 4, 18, 0] : [0, 0, 18, 0])
        : (stack.length ? [0, 4, 0, 0] : [0, 0, 0, 0]);
      stack.push({ stack: companyInfoStack, margin: companyMargin });
    }
    return { stack };
  };

  return {
    stack: [
      {
        table: {
          widths: getHeaderWidths(printSettings.logoPosition, printSettings.companyPosition),
          body: [[buildSlot('left'), buildSlot('center'), buildSlot('right')]]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 4
        }
      },
      { text: data.reportTitle, style: 'reportTitle', margin: [0, 0, 0, 4] }
    ],
    margin: [18, 18, 18, 6]
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

function buildFooter(data: OutturnReportPdfData, currentPage: number, pageCount: number): any {
  return {
    columns: [
      {
        text: `Printed By : ${data.userData?.userName || ''}`,
        fontSize: 7,
        alignment: 'left',
        width: '50%'
      },
      {
        text: `Printed On : ${formatDateValue(new Date())}  Page: ${currentPage} of ${pageCount}`,
        fontSize: 7,
        alignment: 'right',
        width: '50%'
      }
    ],
    margin: [18, 0, 18, 8]
  };
}

function buildContainerInfo(master: any, container: any, params: any): any {
  const vesselName = master?.vesselName || container?.vesselName || '';
  const voyageNo = master?.voyageNo || container?.voyageNo || '';
  const vesselVoyage = voyageNo ? `${vesselName} / ${voyageNo}` : vesselName;

  const leftRows: any[] = [
    buildInfoRow('MBL No', master?.mblNo || ''),
    buildInfoRow('Job No', master?.masterJobNo || ''),
    buildInfoRow('Manifest Seal', container?.lineSeal || ''),
    buildInfoRow('Container Seal No', container?.customsSeal || container?.sealNo || ''),
    buildInfoRow('Shift', ''),
    buildInfoRow('Size', container?.containerType || ''),
    buildInfoRow('Origin Agent', container?.originAgent || '')
  ];

  const rightRows: any[] = [
    buildInfoRow('Job Date', formatDateValue(master?.masterDate)),
    buildInfoRow('Container Owner', ''),
    buildInfoRow('Container No', container?.containerNo || ''),
    buildInfoRow('Vessel / Voyage', vesselVoyage),
    buildInfoRow('De-Stuffing Location', container?.hblRows?.[0]?.cfs || ''),
    buildInfoRow('Port of Load', container?.POL || ''),
    buildInfoRow('Vessel Arrival', formatDateValue(master?.ata || container?.ata)),
    buildInfoRow('De-Stuff Date', formatDateValue(params?.ToDate))
  ];

  return {
    columns: [
      { width: '50%', stack: leftRows },
      { width: '50%', stack: rightRows }
    ],
    margin: [0, 0, 0, 6]
  };
}

function buildInfoRow(label: string, value: string): any {
  return {
    columns: [
      { text: label, bold: true, fontSize: 8, width: 90 },
      { text: `: ${value || ''}`, fontSize: 8, width: '*' }
    ],
    margin: [0, 1, 0, 1]
  };
}

function buildHblTable(container: any): any {
  const headers = [
    'SNo', 'HBL No', 'Manifested Marks & No', 'Actual Marks & Nos', 'Qty Mnfst', 'Qty Lnd',
    'Short', 'Xcess', 'Condition', 'Pkg Type', 'Gross Wt', 'Vol(CBM)', 'Job Type', 'Notes'
  ];
  const widths: any[] = [12, 70, '*', '*', 30, 30, 28, 28, 42, 42, 44, 42, 46, 50];

  const body: any[] = [headers.map(header => buildTableHeaderCell(header))];
  const hblRows = normalizeArray(container?.hblRows);

  if (!hblRows.length) {
    body.push([{
      text: 'No Record Found',
      colSpan: headers.length,
      style: 'emptyCell',
      alignment: 'center'
    }, ...Array(headers.length - 1).fill({})]);
  } else {
    hblRows.forEach((row: any, index: number) => {
      body.push([
        buildTextCell(index + 1, 'center'),
        buildTextCell(row?.hblNo || '-'),
        buildTextCell(row?.marksAndNos || '-'),
        buildTextCell(row?.landedMarksAndNos || '-'),
        buildTextCell(row?.manifestedQty ?? 0, 'right'),
        buildTextCell(row?.qtyLanded ?? 0, 'right'),
        buildTextCell(row?.shortQty ?? 0, 'right'),
        buildTextCell(row?.excessQty ?? 0, 'right'),
        buildTextCell(row?.damageQty ?? 0, 'right'),
        buildTextCell(row?.packageType || '-'),
        buildTextCell(row?.weight ?? 0, 'right'),
        buildTextCell(row?.cbm ?? 0, 'right'),
        buildTextCell(row?.jobType || '-'),
        buildTextCell(row?.remarks || '-')
      ]);
    });
  }

  return {
    table: {
      headerRows: 1,
      widths,
      body
    },
    layout: tableLayout(),
    margin: [0, 0, 0, 8]
  };
}

function buildEmptyBlock(): any {
  return {
    table: {
      widths: ['*'],
      body: [[{ text: 'No Record Found', style: 'emptyCell', alignment: 'center', margin: [0, 6, 0, 6] }]]
    },
    layout: tableLayout()
  };
}

function buildTableHeaderCell(text: string): any {
  return {
    text,
    style: 'tableHeader',
    alignment: 'center'
  };
}

function buildTextCell(value: any, alignment: 'left' | 'center' | 'right' = 'left'): any {
  return {
    text: value == null ? '' : String(value),
    style: 'tableCell',
    alignment
  };
}

function tableLayout(): any {
  return {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingLeft: () => 3,
    paddingRight: () => 3,
    paddingTop: () => 2,
    paddingBottom: () => 2
  };
}

function normalizeArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function formatDateValue(value: any): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-GB');
  } catch {
    return String(value);
  }
}

function getStyles(): any {
  return {
    ...getPdfStyles(),
    headerCompany: {
      bold: true,
      fontSize: 14
    },
    headerBranch: {
      bold: true,
      fontSize: 10
    },
    headerAddress: {
      fontSize: 8
    },
    reportTitle: {
      fontSize: 12,
      bold: true,
      alignment: 'center'
    },
    tableHeader: {
      bold: true,
      fillColor: '#05608d',
      color: '#ffffff',
      fontSize: 8
    },
    tableCell: {
      fontSize: 8
    },
    emptyCell: {
      italics: true,
      fontSize: 8
    }
  };
}
