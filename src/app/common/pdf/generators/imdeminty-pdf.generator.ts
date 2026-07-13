import { createFooterFunction } from '../builders/pdf-footer.builder';
import { buildCompanyHeader } from '../builders/pdf-header.builder';
import { formatDate } from '../helpers/pdf-formatters';
import { ImdemintyPdfData } from '../interfaces/pdf-document.interfaces';
import { PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS, getPdfStyles } from '../styles/pdf-styles';

const INDEMNITY_BODY =
  'We hereby undertake & agree to indemnify you fully against all consequences and/or liabilities of any kind whatsoever directly or indirectly arising or relating to the said delivery & immediately on demand against all payments made by you in respect of such consequences and/or liabilities, including costs as between solicitor & client and any sums demanded by you for the defense of any proceeding brought against you by reason of the delivery aforesaid...';

function buildImdemintyHeader(data: ImdemintyPdfData): any {
  return {
    stack: [
      buildCompanyHeader(data),
      {
        table: {
          widths: ['*'],
          body: [[{ text: '', border: [false, false, false, true] }]]
        },
        layout: {
          hLineWidth: () => 0.25,
          vLineWidth: () => 0,
          hLineColor: () => '#000000',
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        },
        margin: [0, 6, 0, 0]
      }
    ],
    margin: [10, 22, 10, 0]
  };
}

export function generateImdemintyDocument(data: ImdemintyPdfData): any {
  const containerList = (data.containerList && data.containerList.length > 0) ? data.containerList : ['—'];
  const content = containerList.map((containerNo, index) =>
    buildIndemnityPage(data, containerNo, index === containerList.length - 1)
  );

  return {
    pageSize: data.config?.pageSize || PDF_DEFAULT_CONFIG.pageSize,
    pageOrientation: 'portrait',
    pageMargins: data.config?.pageMargins || [20, 108, 20, 32],
    background: (_currentPage: number, pageSize: any) => ({
      canvas: [
        {
          type: 'rect',
          x: 12,
          y: 12,
          w: pageSize.width - 24,
          h: pageSize.height - 24,
          lineWidth: 0.25,
          lineColor: '#000000'
        }
      ]
    }),
    header: () => buildImdemintyHeader(data),
    footer: createFooterFunction(data.userData, { showPageNumbers: true, pageMargins: [30, 0, 30, 6] }),
    content,
    styles: getPdfStyles(),
    defaultStyle: PDF_DEFAULT_CONFIG.defaultStyle
  };
}

function buildIndemnityPage(data: ImdemintyPdfData, containerNo: string, isLast: boolean): any {
  return {
    stack: [
      buildTitle(),
      buildGreeting(),
      buildVesselDetails(data, containerNo),
      buildIntroParagraph(),
      buildConsignmentTable('HBL No.', data),
      buildOutturnParagraph(),
      buildConsignmentTable('BL No.', data),
      buildBodyParagraph()
    ],
    pageBreak: isLast ? undefined : 'after'
  };
}

function buildTitle(): any {
  return {
    table: {
      widths: ['*'],
      body: [[
        {
          text: 'LETTER OF INDEMNITY',
          style: 'documentTitle',
          fontSize: 13,
          alignment: 'center',
          bold: true,
          margin: [0, 4, 0, 4]
        }
      ]]
    },
    layout: {
      hLineWidth: (i: number) => (i === 0 ? 0.25 : 0),
      vLineWidth: () => 0,
      hLineColor: () => '#000000',
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [0, 0, 0, 10]
  };
}

function buildGreeting(): any {
  return {
    text: 'Dear Sir,',
    bold: true,
    fontSize: 10,
    margin: [0, 0, 0, 8]
  };
}

function buildVesselDetails(data: ImdemintyPdfData, containerNo: string): any {
  const houseJob = data.houseJob || {};
  return {
    table: {
      widths: ['50%', '50%'],
      body: [[
        {
          stack: [
            buildKeyValueRow('Vessel Name', houseJob.vesselName || ''),
            buildKeyValueRow('ETA', houseJob.eta ? formatDate(houseJob.eta) : ''),
            buildKeyValueRow('Container No.', containerNo)
          ],
          margin: [6, 2, 6, 2]
        },
        {
          stack: [
            buildKeyValueRow('Voyage No.', houseJob.voyageNo || ''),
            buildKeyValueRow('Date', houseJob.hblDate ? formatDate(houseJob.hblDate) : '')
          ],
          margin: [6, 2, 6, 2]
        }
      ]]
    },
    layout: outerBorderLayout(),
    margin: [0, 0, 0, 10]
  };
}

function buildIntroParagraph(): any {
  return {
    text: 'We should advise that according to the bill of lading, the details of the following consignment are as follows:',
    bold: true,
    fontSize: 8,
    margin: [0, 0, 0, 4]
  };
}

function buildOutturnParagraph(): any {
  return {
    text: 'However, we have found that the cargo outturned with the following details:',
    bold: true,
    fontSize: 8,
    margin: [0, 2, 0, 4]
  };
}

function buildConsignmentTable(firstHeaderLabel: string, data: ImdemintyPdfData): any {
  const houseJob = data.houseJob || {};
  return {
    table: {
      headerRows: 1,
      widths: ['20%', '40%', '40%'],
      body: [
        [
          { text: firstHeaderLabel, style: 'tableHeader', fontSize: 9, alignment: 'center' },
          { text: 'Marks and Numbers', style: 'tableHeader', fontSize: 9, alignment: 'center' },
          { text: 'Goods Description', style: 'tableHeader', fontSize: 9, alignment: 'center' }
        ],
        [
          { text: houseJob.hblNo || '', style: 'tableCell', fontSize: 9, alignment: 'center' },
          { text: houseJob.marksAndNumbers || '', style: 'tableCell', fontSize: 9 },
          { text: houseJob.goodsDescription || '', style: 'tableCell', fontSize: 9 }
        ]
      ]
    },
    layout: thinBorderedLayout(),
    margin: [0, 0, 0, 6]
  };
}

function buildBodyParagraph(): any {
  return {
    text: INDEMNITY_BODY,
    fontSize: 7.5,
    lineHeight: 1.4,
    margin: [0, 8, 0, 0]
  };
}

function buildKeyValueRow(label: string, value: string, labelWidth = 95): any {
  return {
    columns: [
      { text: label, bold: true, width: labelWidth, fontSize: 9 },
      { text: ':', width: 8, fontSize: 9 },
      { text: value || '', width: '*', fontSize: 9 }
    ],
    margin: [0, 0, 0, 3]
  };
}

function thinBorderedLayout(): any {
  return {
    ...PDF_TABLE_LAYOUTS.bordered,
    hLineWidth: () => 0.25,
    vLineWidth: () => 0.25
  };
}

function outerBorderLayout(): any {
  return {
    ...PDF_TABLE_LAYOUTS.bordered,
    hLineWidth: () => 0.25,
    vLineWidth: (i: number, node: any) =>
      i === 0 || i === node.table.widths.length ? 0.25 : 0
  };
}

export function transformImdemintyApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  options?: {
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
  }
): ImdemintyPdfData {
  const cargo = apiData?.Cargo?.[0] || {};
  const containerSet = new Set<string>();
  (apiData?.Products || []).forEach((product: any) => {
    if (product?.ContainerNo) {
      containerSet.add(product.ContainerNo);
    }
  });

  return {
    company: {
      companyName: company?.CompanyName || company?.companyName || '',
      addressLine1: company?.Address || company?.addressLine1 || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || company?.city || '',
      postalCode: company?.ZipCode || company?.postalCode || '',
      phoneNumber: company?.Phone || company?.phoneNumber || ''
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
    printSettings: options?.printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
    containerList: Array.from(containerSet),
    houseJob: {
      vesselName: apiData?.VesselName || '',
      eta: apiData?.ETA || '',
      voyageNo: apiData?.VoyageNo || '',
      hblDate: apiData?.HBLDate || '',
      hblNo: apiData?.HBLNo || '',
      marksAndNumbers: cargo?.MarksAndNumber || '',
      goodsDescription: cargo?.CommodityDescription || ''
    }
  };
}
