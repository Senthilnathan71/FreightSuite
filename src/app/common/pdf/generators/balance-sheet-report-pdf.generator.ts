import { PdfBranchInfo, PdfCompanyInfo, PdfUserInfo } from '../interfaces/pdf-base.interface';
import { getPdfStyles } from '../styles/pdf-styles';

export interface BalanceSheetReportPdfData {
  company: PdfCompanyInfo;
  branch: PdfBranchInfo;
  userData: PdfUserInfo;
  logo?: string;
  orientation?: 'portrait' | 'landscape';
  reportTitle: string;
  params?: any;
  fullData?: any;
  retainedEarning: number;
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
  orientation: 'portrait' | 'landscape' = 'landscape'
): BalanceSheetReportPdfData {
  const fullData = rawData || {};
  const processedFunds = processFunds(fullData?.data || []);
  const retainedEarning = resolveRetainedEarning(fullData);
  const sourceOfFundsCategories = processedFunds.filter(cat => cat.category !== 'Asset');
  const assetCategories = processedFunds.filter(cat => cat.category === 'Asset');
  const totalSourceOfFunds = retainedEarning + sourceOfFundsCategories.reduce((sum, cat) => sum + (cat.categoryTotal || 0), 0);
  const totalApplicationOfFunds = assetCategories.reduce((sum, cat) => sum + (cat.categoryTotal || 0), 0);

  return {
    company,
    branch,
    userData,
    logo,
    orientation,
    reportTitle: 'Balance Sheet Report',
    params: fullData?.params || {},
    fullData,
    retainedEarning,
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
  const address1 = data.branch?.addressLine1 || data.company?.addressLine1 || '';
  const address2 = [
    data.branch?.addressLine2 || '',
    data.branch?.cityMaster?.cityName || data.branch?.cityName || '',
    data.branch?.postalCode ? `Postal Code : ${data.branch.postalCode}` : '',
    data.branch?.phoneNumber ? `Ph.no : ${data.branch.phoneNumber}` : ''
  ].filter(Boolean).join(', ');

  return {
    stack: [
      {
        columns: [
          data.logo ? { image: data.logo, fit: [50, 50], width: 56, margin: [0, 4, 0, 0] } : { text: '', width: 56 },
          {
            width: '*',
            stack: [
              { text: (data.company?.companyName || '').toUpperCase(), style: 'headerCompany', alignment: 'center' },
              { text: data.branch?.branchName || '', style: 'headerBranch', alignment: 'center', margin: [0, 1, 0, 0] },
              { text: address1, style: 'headerAddress', alignment: 'center', margin: [0, 1, 0, 0] },
              { text: address2, style: 'headerAddress', alignment: 'center', margin: [0, 1, 0, 0] }
            ]
          },
          { text: '', width: 56 }
        ]
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
      { text: 'Category Total', colSpan: 3, style: 'totalLabelCell', alignment: 'right' },
      {},
      {},
      buildNumberCell(data.retainedEarning, true)
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
    rows.push(...buildCategoryRows(cat));
  });

  rows.push([
    { text: 'Total Application of Funds', colSpan: 3, style: 'grandTotalLabelCell', alignment: 'right' },
    {},
    {},
    buildNumberCell(data.totalApplicationOfFunds, true, true)
  ]);

  return rows;
}

function buildCategoryRows(cat: any): any[] {
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
      buildNumberCell(item?.LocalAmt)
    ]);
  });

  rows.push([
    { text: 'Category Total', colSpan: 3, style: 'totalLabelCell', alignment: 'right' },
    {},
    {},
    buildNumberCell(cat?.categoryTotal, true)
  ]);

  return rows;
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
