import { PdfBranchInfo, PdfCompanyInfo, PdfUserInfo } from '../interfaces/pdf-base.interface';
import { getPdfStyles } from '../styles/pdf-styles';

export interface BalanceSheetReportPdfData {
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
  retainedEarning: number;
  openingRetainedEarning: number;
  totalRetainedEarning: number;
  retainedEarningLabel: string;
  sourceOfFundsCategories: any[];
  assetCategories: any[];
  totalSourceOfFunds: number;
  totalApplicationOfFunds: number;
}

export function transformBalanceSheetReportData(
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
): BalanceSheetReportPdfData {
  const fullData = rawData || {};
  const processedFunds = processFunds(fullData?.data || []);
  const retainedEarning = resolveRetainedEarning(fullData);
  const openingRetainedEarning = Number(fullData?.openingRetained || 0);
  const totalRetainedEarning = retainedEarning + openingRetainedEarning;
  const sourceOfFundsCategories = processedFunds.filter(cat => cat.category !== 'Asset');
  const assetCategories = processedFunds.filter(cat => cat.category === 'Asset');
  const totalSourceOfFunds = totalRetainedEarning + sourceOfFundsCategories.reduce((sum, cat) => sum + (cat.categoryTotal || 0), 0);
  const totalApplicationOfFunds = assetCategories.reduce((sum, cat) => sum + (cat.categoryTotal || 0), 0);

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
    reportTitle: 'Balance Sheet Report',
    params: fullData?.params || {},
    fullData,
    retainedEarning,
    openingRetainedEarning,
    totalRetainedEarning,
    retainedEarningLabel: getRetainedEarningLabel(fullData?.params?.ToDate),
    sourceOfFundsCategories,
    assetCategories,
    totalSourceOfFunds,
    totalApplicationOfFunds
  };
}

function resolveRetainedEarning(fullData: any): number {
  const retained = fullData?.retained;

  if (typeof retained === 'number') {
    return Number(retained) || 0;
  }

  if (retained && typeof retained === 'object') {
    const retainedValue = retained?.netProfit ?? retained?.amount ?? retained?.value;
    return Number(retainedValue) || 0;
  }

  return (fullData?.incomeTotal || 0) - (fullData?.expenseTotal || 0);
}

export function generateBalanceSheetReportDocument(data: BalanceSheetReportPdfData): any {
  return {
    pageSize: 'A4',
    pageOrientation: data.orientation || 'landscape',
    pageMargins: [18, 118, 18, 30],
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
    content: [buildPanelsTable(data)],
    styles: getStyles(),
    defaultStyle: {
      fontSize: 8,
      color: '#000'
    }
  };
}

function buildHeader(data: BalanceSheetReportPdfData): any {
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
      {
        text: data.reportTitle,
        style: 'reportTitle',
        margin: [0, 0, 0, 8]
      },
      {
        columns: [
          {
            width: '34%',
            stack: [
              buildFilterRow('From Date', formatDateValue(data.params?.FromDate)),
              buildFilterRow('To Date', formatDateValue(data.params?.ToDate))
            ]
          },
          { width: '*', text: '' },
          {
            width: '24%',
            stack: [
              buildFilterRow('Branch', data.fullData?.branchInvolved || 'All')
            ]
          }
        ],
        margin: [0, 0, 0, 6]
      }
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

function buildPanelsTable(data: BalanceSheetReportPdfData): any {
  return {
    table: {
      widths: ['49.2%', '1.6%', '49.2%'],
      body: [[
        buildPanel('Source of Funds', 'Equity', buildSourceRows(data), true),
        { text: '', border: [false, false, false, false] },
        buildPanel('Application of Funds', 'Asset', buildAssetRows(data), false)
      ]]
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    }
  };
}

function buildPanel(title: string, sectionLabel: string, rows: any[], includeRetainedEarning: boolean): any {
  const body: any[] = [
    [{ text: sectionLabel, colSpan: 4, style: 'panelSectionLabel', alignment: 'left' }, {}, {}, {}],
    [
      buildTableHeaderCell('Group'),
      buildTableHeaderCell('SubGroup'),
      buildTableHeaderCell('Ledger'),
      buildTableHeaderCell('Balance')
    ],
    ...rows
  ];

  return {
    stack: [
      { text: title, style: 'panelTitle', margin: [0, 0, 0, 4] },
      {
        table: {
          headerRows: 2,
          widths: ['22%', '25%', '*', '23%'],
          body
        },
        layout: panelTableLayout()
      }
    ]
  };
}

function buildSourceRows(data: BalanceSheetReportPdfData): any[] {
  const rows: any[] = [
    [
      buildTextCell('Reserve & Surplus', true),
      buildTextCell('Retained Earning', true),
      buildTextCell(data.retainedEarningLabel),
      buildNumberCell(data.retainedEarning, true)
    ],
    [
      buildTextCell('Reserve & Surplus', true),
      buildTextCell('Retained Earning', true),
      buildTextCell('Retained Earning (Before From Date)'),
      buildNumberCell(data.openingRetainedEarning, true)
    ],
    [
      { text: 'Category Total', colSpan: 3, style: 'totalLabelCell', alignment: 'right' },
      {},
      {},
      buildNumberCell(data.totalRetainedEarning, true)
    ]
  ];

  data.sourceOfFundsCategories.forEach(cat => {
    rows.push([{ text: cat.category || '', colSpan: 4, style: 'categoryRow' }, {}, {}, {}]);
    rows.push(...buildCategoryRows(cat));
  });

  rows.push([
    { text: 'Total Source of Funds', colSpan: 3, style: 'grandTotalLabelCell', alignment: 'right' },
    {},
    {},
    buildNumberCell(data.totalSourceOfFunds, true, true)
  ]);

  return rows;
}

function buildAssetRows(data: BalanceSheetReportPdfData): any[] {
  const rows: any[] = [];

  data.assetCategories.forEach(cat => {
    rows.push(...buildCategoryRows(cat, true));
  });

  rows.push([
    { text: 'Total Application of Funds', colSpan: 3, style: 'grandTotalLabelCell', alignment: 'right' },
    {},
    {},
    buildNumberCell(flipSign(data.totalApplicationOfFunds), true, true)
  ]);

  return rows;
}

function buildCategoryRows(cat: any, flipValues = false): any[] {
  const rows: any[] = [];
  let currentGroup = '';
  let currentSubGroup = '';

  (cat?.items || []).forEach((item: any) => {
    const showGroup = !!item?.showGroup;
    const showSubGroup = !!item?.showSubGroup;
    currentGroup = showGroup ? (item?.groupName || '') : currentGroup;
    currentSubGroup = showSubGroup ? (item?.subgroupName || '') : currentSubGroup;

    rows.push([
      buildTextCell(showGroup ? currentGroup : '', true),
      buildTextCell(showSubGroup ? currentSubGroup : '', true),
      buildTextCell(item?.ledgerName || ''),
      buildNumberCell(flipValues ? flipSign(item?.LocalAmt) : item?.LocalAmt)
    ]);
  });

  rows.push([
    { text: 'Category Total', colSpan: 3, style: 'totalLabelCell', alignment: 'right' },
    {},
    {},
    buildNumberCell(flipValues ? flipSign(cat?.categoryTotal) : cat?.categoryTotal, true)
  ]);

  return rows;
}

function flipSign(value: any): number {
  return -1 * (Number(value) || 0);
}

function buildTableHeaderCell(text: string): any {
  return {
    text,
    style: 'tableHeader',
    alignment: 'center'
  };
}

function buildTextCell(value: any, bold = false): any {
  return {
    text: value == null ? '' : String(value),
    style: bold ? 'boldCell' : 'tableCell'
  };
}

function buildNumberCell(value: any, bold = false, grand = false): any {
  return {
    text: formatNumber(value),
    style: grand ? 'grandTotalValueCell' : bold ? 'totalValueCell' : 'tableCell',
    alignment: 'right',
    noWrap: true
  };
}

function buildFilterRow(label: string, value: string): any {
  return {
    columns: [
      { text: label, bold: true, fontSize: 8, width: 70 },
      { text: `: ${value || ''}`, fontSize: 8, width: '*' }
    ],
    margin: [0, 1, 0, 1]
  };
}

function panelTableLayout(): any {
  return {
    hLineWidth: () => 0.6,
    vLineWidth: () => 0.6,
    hLineColor: () => '#000',
    vLineColor: () => '#000',
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 3,
    paddingBottom: () => 3
  };
}

function buildFooter(data: BalanceSheetReportPdfData, currentPage: number, pageCount: number): any {
  return {
    columns: [
      {
        text: `Printed By : ${data.userData?.userName || ''}`,
        fontSize: 7,
        alignment: 'left',
        width: '50%'
      },
      {
        text: `Printed On : ${formatDateValue(new Date())}`,
        fontSize: 7,
        alignment: 'right',
        width: '50%'
      }
    ],
    margin: [18, 0, 18, 8]
  };
}

function buildNoteSection(): any {
  return {
    margin: [0, 8, 0, 0],
    stack: [
      { text: 'Note :', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
      {
        text: '• Retained Earnings takes both From Date and To Date, while the remaining take only the To Date.',
        fontSize: 8
      }
    ]
  };
}

function processFunds(items: any[]): any[] {
  if (!items?.length) return [];

  const categoryMap = new Map<string, any[]>();
  items.forEach(item => {
    if (!categoryMap.has(item.category)) categoryMap.set(item.category, []);
    categoryMap.get(item.category)?.push(item);
  });

  const processedFunds: any[] = [];

  categoryMap.forEach((categoryItems, category) => {
    const categoryTotal = categoryItems.reduce((sum, item) => sum + (Number(item.LocalAmt) || 0), 0);
    const groupMap = new Map<string, any[]>();

    categoryItems.forEach(item => {
      const groupKey = item.groupName || '';
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
      groupMap.get(groupKey)?.push(item);
    });

    const processedItems: any[] = [];

    groupMap.forEach(groupItems => {
      const subgroupMap = new Map<string, any[]>();
      groupItems.forEach(item => {
        const subKey = item.subgroupName || '';
        if (!subgroupMap.has(subKey)) subgroupMap.set(subKey, []);
        subgroupMap.get(subKey)?.push(item);
      });

      subgroupMap.forEach(subItems => {
        subItems.forEach((item, index) => {
          processedItems.push({
            ...item,
            showGroup: index === 0 && groupItems[0] === subItems[0],
            showSubGroup: index === 0
          });
        });
      });
    });

    processedFunds.push({
      category,
      items: processedItems,
      categoryTotal
    });
  });

  return processedFunds;
}

function getRetainedEarningLabel(toDate: any): string {
  if (!toDate) return 'Retained Earning';
  const year = new Date(toDate).getFullYear();
  return `Retained Earning ${year}`;
}

function formatDateValue(value: any): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-GB');
  } catch {
    return String(value);
  }
}

function formatNumber(value: any): string {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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
    panelTitle: {
      fontSize: 10,
      bold: true
    },
    panelSectionLabel: {
      fontSize: 9,
      bold: true
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
    boldCell: {
      fontSize: 8,
      bold: true
    },
    categoryRow: {
      fontSize: 8,
      bold: true
    },
    totalLabelCell: {
      fontSize: 8,
      bold: true
    },
    totalValueCell: {
      fontSize: 8,
      bold: true
    },
    grandTotalLabelCell: {
      fontSize: 8,
      bold: true,
      fillColor: '#e9ecef'
    },
    grandTotalValueCell: {
      fontSize: 8,
      bold: true,
      fillColor: '#e9ecef'
    }
  };
}
