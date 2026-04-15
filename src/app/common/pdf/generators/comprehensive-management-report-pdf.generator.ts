import { PdfBranchInfo, PdfCompanyInfo, PdfUserInfo } from '../interfaces/pdf-base.interface';
import { getPdfStyles } from '../styles/pdf-styles';

export interface ComprehensiveManagementReportPdfData {
  company: PdfCompanyInfo;
  branch: PdfBranchInfo;
  userData: PdfUserInfo;
  logo?: string;
  orientation?: 'portrait' | 'landscape';
  reportTitle: string;
  params?: any;
  fullData?: any;
  bookingRows: any[];
  masterJobRows: any[];
  houseJobRows: any[];
  groupedSalesmanRows: Array<{
    DepartmentMasterSid?: number;
    DepartmentName?: string;
    salesmen: any[];
  }>;
  customerRows: any[];
  vendorRows: any[];
  cashBankRows: any[];
}

export function transformComprehensiveManagementReportData(
  rawData: any,
  company: PdfCompanyInfo,
  branch: PdfBranchInfo,
  userData: PdfUserInfo,
  logo?: string,
  orientation: 'portrait' | 'landscape' = 'landscape'
): ComprehensiveManagementReportPdfData {
  const fullData = rawData || {};
  const salesmanRows = normalizeArray(fullData?.salesmanSummary);

  return {
    company,
    branch,
    userData,
    logo,
    orientation,
    reportTitle: 'Comprehensive Management Report',
    params: fullData?.params || {},
    fullData,
    bookingRows: normalizeArray(fullData?.bookingDeptSummary),
    masterJobRows: normalizeArray(fullData?.reportMap),
    houseJobRows: normalizeArray(fullData?.houseWithAllCal),
    groupedSalesmanRows: groupSalesmenByDepartment(salesmanRows),
    customerRows: normalizeArray(fullData?.customerRows),
    vendorRows: normalizeArray(fullData?.vendorRows),
    cashBankRows: normalizeArray(fullData?.AllCashAndBank)
  };
}

export function generateComprehensiveManagementReportDocument(
  data: ComprehensiveManagementReportPdfData
): any {
  const content: any[] = [
    buildSummaryTable(
      'Booking Details',
      ['Dept', 'No of Booking', 'Revenue', 'Cost', 'Profit', 'Gross Wt', 'Net Wt', 'CBM'],
      Array(8).fill('*'),
      data.bookingRows.map(item => [
        item?.dept || '',
        item?.totalBookings ?? 0,
        item?.totalRevenue,
        item?.totalCost,
        item?.totalProfit,
        item?.totalGrossWt,
        item?.totalNetWt,
        item?.totalVolume
      ]),
      { integerColumns: [1], centerColumns: [1] }
    ),
    buildSummaryTable(
      'Master Job Details',
      ['Dept', 'No of Master Jobs', 'Revenue', 'Cost', 'Profit', 'Gross Wt', 'Net Wt', 'CBM', 'TEUs'],
      Array(9).fill('*'),
      data.masterJobRows.map(item => [
        item?.Department || '',
        item?.NoOfMasterJobs ?? 0,
        item?.Revenue,
        item?.Cost,
        item?.Profit,
        item?.GrossWeight,
        item?.NetWeight,
        item?.CBM,
        item?.TEU ?? 0
      ]),
      { integerColumns: [1], centerColumns: [1] }
    ),
    buildSummaryTable(
      'House Job Details',
      ['Dept', 'No of House Jobs', 'Revenue', 'Cost', 'Profit', 'Gross Wt', 'Net Wt', 'CBM'],
      Array(8).fill('*'),
      data.houseJobRows.map(item => [
        item?.Department || '',
        item?.NoOfHouseJobs ?? 0,
        item?.Revenue,
        item?.Cost,
        item?.Profit,
        item?.GrossWeight,
        item?.NetWeight,
        item?.CBM
      ]),
      { integerColumns: [1], centerColumns: [1] }
    ),
    buildSalesmanPerformanceTable(data),
    buildSummaryTable(
      'Customer Outstanding',
      ['Customer', 'Salesman', 'Total Outstanding', '0-30', '31-60', '61-90', '91-120', '120 & Above', 'Credit Days', 'Credit Limit'],
      ['*', '*', 62, 44, 44, 44, 44, 56, 48, 56],
      data.customerRows.map(item => [
        item?.SubledgerName || '',
        item?.SalesmanName || '',
        item?.TotalOutstanding,
        item?.buckets?.['0-30'],
        item?.buckets?.['31-60'],
        item?.buckets?.['61-90'],
        item?.buckets?.['91-120'],
        item?.buckets?.['120 & Above'],
        item?.CreditDays ?? 0,
        item?.CreditLimit
      ]),
      { fontSize: 7 }
    ),
    buildSummaryTable(
      'Vendor Outstanding',
      ['Vendor', 'Total Outstanding', '0-30', '31-60', '61-90', '91-120', '120 & Above', 'Credit Days', 'Credit Limit'],
      ['*', 64, 48, 48, 48, 48, 60, 50, 60],
      data.vendorRows.map(item => [
        item?.SubledgerName || '',
        item?.TotalOutstanding,
        item?.buckets?.['0-30'],
        item?.buckets?.['31-60'],
        item?.buckets?.['61-90'],
        item?.buckets?.['91-120'],
        item?.buckets?.['120 & Above'],
        item?.CreditDays ?? 0,
        item?.CreditLimit
      ]),
      { fontSize: 7 }
    ),
    buildSummaryTable(
      'Cash and Bank',
      ['Account', 'Dr Amount', 'Cr Amount', 'Dr-Cr Balance'],
      ['*', 80, 80, 90],
      data.cashBankRows.map(item => [
        item?.LedgerName || '',
        item?.DrAmount,
        item?.CrAmount,
        item?.Balance
      ])
    )
  ];

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
    content,
    styles: getStyles(),
    defaultStyle: {
      fontSize: 8,
      color: '#000'
    }
  };
}

function buildHeader(data: ComprehensiveManagementReportPdfData): any {
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
      buildTitle(data.reportTitle),
      buildFilterSummary(data)
    ],
    margin: [18, 18, 18, 6]
  };
}

function buildTitle(title: string): any {
  return {
    text: title,
    style: 'reportTitle',
    margin: [0, 0, 0, 8]
  };
}

function buildFooter(
  data: ComprehensiveManagementReportPdfData,
  currentPage: number,
  pageCount: number
): any {
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

function buildFilterSummary(data: ComprehensiveManagementReportPdfData): any {
  const fullData = data.fullData || {};
  return {
    columns: [
      {
        width: '42%',
        stack: [
          buildFilterRow('From Date', formatDateValue(data.params?.FromDate)),
          buildFilterRow('To Date', formatDateValue(data.params?.ToDate))
        ]
      },
      { width: '*', text: '' },
      {
        width: '28%',
        stack: [
          buildFilterRow('Branch', fullData?.branchesInvolved || ''),
          buildFilterRow('Dept', fullData?.departmentInvolved || '')
        ]
      }
    ],
    margin: [0, 0, 0, 6]
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

function buildSalesmanPerformanceTable(data: ComprehensiveManagementReportPdfData): any {
  const headers = ['Salesman', 'Lead', 'Opportunity', 'Meetings', 'Enquiry', 'Quotation', 'Booking'];
  const body: any[] = [
    headers.map((header, index) => buildTableHeaderCell(header, index === 0 ? 'left' : 'center'))
  ];

  if (!data.groupedSalesmanRows.length) {
    body.push([{
      text: 'No Record Found',
      colSpan: headers.length,
      style: 'emptyCell',
      alignment: 'center'
    }, ...Array(headers.length - 1).fill({})]);
  } else {
    data.groupedSalesmanRows.forEach(group => {
      group.salesmen.forEach(item => {
        body.push([
          buildTextCell(item?.SalesmanName || ''),
          buildNumberCell(item?.TotalLeads, 'center', false),
          buildNumberCell(item?.TotalOpportunity, 'center', false),
          buildNumberCell(item?.TotalMeetings, 'center', false),
          buildNumberCell(item?.TotalEnquiries, 'center', false),
          buildNumberCell(item?.TotalQuotations, 'center', false),
          buildNumberCell(item?.TotalBookings, 'center', false)
        ]);
      });
    });
  }

  return {
    stack: [
      { text: 'Salesman Performance', style: 'sectionTitle', margin: [0, 0, 0, 4] },
      {
        table: {
          headerRows: 1,
          widths: Array(7).fill('*'),
          body
        },
        layout: tableLayout(),
        margin: [0, 0, 0, 8]
      }
    ]
  };
}

function buildSummaryTable(
  title: string,
  headers: string[],
  widths: any[],
  rows: any[][],
  options?: { fontSize?: number; integerColumns?: number[]; centerColumns?: number[] }
): any {
  const body: any[] = [
    headers.map((header, index) =>
      buildTableHeaderCell(header, index === 0 ? 'left' : 'center')
    )
  ];

  if (!rows.length) {
    body.push([{
      text: 'No Record Found',
      colSpan: headers.length,
      style: 'emptyCell',
      alignment: 'center'
    }, ...Array(headers.length - 1).fill({})]);
  } else {
    rows.forEach(row => {
      body.push(row.map((value, index) => {
        if (index === 0) return buildTextCell(value, options?.fontSize);
        if (typeof value === 'number' || value === null || value === undefined || value === '') {
          const alignment = options?.centerColumns?.includes(index) ? 'center' : 'right';
          const useCurrencyFormat = !options?.integerColumns?.includes(index);
          return buildNumberCell(value, alignment, useCurrencyFormat, options?.fontSize);
        }
        return buildTextCell(value, options?.fontSize, index === 1 && title === 'Customer Outstanding');
      }));
    });
  }

  return {
    stack: [
      { text: title, style: 'sectionTitle', margin: [0, 0, 0, 4] },
      {
        table: {
          headerRows: 1,
          widths,
          body
        },
        layout: tableLayout(),
        margin: [0, 0, 0, 8]
      }
    ]
  };
}

function buildTableHeaderCell(text: string, alignment: 'left' | 'center' | 'right' = 'center'): any {
  return {
    text,
    style: 'tableHeader',
    alignment
  };
}

function buildTextCell(value: any, fontSize?: number, noWrap = false): any {
  return {
    text: value == null ? '' : String(value),
    style: 'tableCell',
    fontSize,
    noWrap
  };
}

function buildNumberCell(
  value: any,
  alignment: 'left' | 'center' | 'right' = 'right',
  useCurrencyFormat = true,
  fontSize?: number
): any {
  return {
    text: useCurrencyFormat ? formatNumber(value) : formatPlainValue(value),
    style: 'tableCell',
    alignment,
    fontSize,
    noWrap: true
  };
}

function buildLabelCell(label: string): any {
  return {
    text: label,
    bold: true,
    fontSize: 8
  };
}

function buildValueCell(value: string): any {
  return {
    text: `: ${value || ''}`,
    fontSize: 8
  };
}

function tableLayout(): any {
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

function normalizeArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function groupSalesmenByDepartment(data: any[]): Array<{ DepartmentMasterSid?: number; DepartmentName?: string; salesmen: any[] }> {
  const map = new Map<number | string, { DepartmentMasterSid?: number; DepartmentName?: string; salesmen: any[] }>();

  data.forEach(item => {
    const key = item?.DepartmentMasterSid ?? item?.DepartmentName ?? 'default';
    if (!map.has(key)) {
      map.set(key, {
        DepartmentMasterSid: item?.DepartmentMasterSid,
        DepartmentName: item?.DepartmentName,
        salesmen: []
      });
    }
    map.get(key)?.salesmen.push(item);
  });

  return Array.from(map.values());
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

function formatPlainValue(value: any): string {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
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
    sectionTitle: {
      fontSize: 9,
      bold: true
    },
    sectionSubHeader: {
      bold: true,
      fillColor: '#eaf2ff',
      fontSize: 8
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
