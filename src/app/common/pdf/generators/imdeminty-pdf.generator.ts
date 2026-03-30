import { createFooterFunction } from '../builders/pdf-footer.builder';
import { formatDate } from '../helpers/pdf-formatters';
import { ImdemintyPdfData } from '../interfaces/pdf-document.interfaces';
import { PDF_DEFAULT_CONFIG, PDF_TABLE_LAYOUTS, getPdfStyles } from '../styles/pdf-styles';

const INDEMNITY_BODY =
  'We hereby undertake & agree to indemnify you fully against all consequences and/or liabilities of any kind whatsoever directly or indirectly arising or relating to the said delivery & immediately on demand against all payments made by you in respect of such consequences and/or liabilities, including costs as between solicitor & client and any sums demanded by you for the defense of any proceeding brought against you by reason of the delivery aforesaid...';

function buildImdemintyHeader(data: ImdemintyPdfData): any {
  const company = data.company;
  const branch = data.branch;
  const logo = data.logo;

  const companyName = (company?.companyName || '').toUpperCase();
  const branchName = branch?.branchName || '';
  const addressLine1 = branch?.addressLine1 || company?.addressLine1 || '';
  const addressLine2 = branch?.addressLine2 || company?.addressLine2 || '';
  const cityName = branch?.cityMaster?.cityName || branch?.cityName || company?.city || '';
  const postalCode = branch?.postalCode || company?.postalCode || '';
  const phone = branch?.phoneNumber || company?.phoneNumber || '';

  const addressLine2Prefix = [addressLine2, cityName].filter(Boolean).join(', ');
  const addressLine2Text = addressLine2Prefix ? `${addressLine2Prefix}, ` : '';

  const lineTwoParts: any[] = [];
  if (addressLine2Text) {
    lineTwoParts.push({ text: addressLine2Text });
  }
  if (postalCode) {
    lineTwoParts.push({ text: 'Postal Code : ', bold: true });
    lineTwoParts.push({ text: postalCode });
  }
  if (phone) {
    lineTwoParts.push({ text: `${postalCode ? ' , ' : ''}Ph.no : `, bold: true });
    lineTwoParts.push({ text: phone });
  }

  const logoCell = logo
    ? {
        table: {
          widths: [90],
          body: [[
            {
              image: logo,
              width: 70,
              height: 70,
              alignment: 'center',
              margin: [0, 6, 0, 6]
            }
          ]]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000',
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        },
        width: 100
      }
    : { text: '', width: 100 };

  const headerContent = {
    columns: [
      logoCell,
      {
        stack: [
          companyName
            ? { text: companyName, style: 'companyName', alignment: 'center', margin: [0, 0, 0, 2] }
            : { text: '' },
          branchName
            ? { text: branchName, style: 'branchName', alignment: 'center', margin: [0, 0, 0, 2] }
            : { text: '' },
          addressLine1
            ? { text: addressLine1, style: 'addressText', alignment: 'center', margin: [0, 0, 0, 2] }
            : { text: '' },
          lineTwoParts.length
            ? { text: lineTwoParts, style: 'addressText', alignment: 'center' }
            : { text: '' }
        ]
      },
      { text: '', width: 100 }
    ],
    margin: [6, 0, 6, 4]
  };

  return {
    stack: [
      headerContent,
      {
        table: {
          widths: ['*'],
          body: [[{ text: '', border: [false, false, false, true] }]]
        },
        layout: {
          hLineWidth: () => 1,
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
    pageMargins: data.config?.pageMargins || [20, 78, 20, 32],
    background: (_currentPage: number, pageSize: any) => ({
      canvas: [
        {
          type: 'rect',
          x: 12,
          y: 12,
          w: pageSize.width - 24,
          h: pageSize.height - 24,
          lineWidth: 1,
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
    text: 'LETTER OF INDEMNITY',
    style: 'documentTitle',
    alignment: 'center',
    bold: true,
    margin: [0, 6, 0, 10]
  };
}

function buildGreeting(): any {
  return {
    text: 'Dear Sir,',
    bold: true,
    fontSize: 11,
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
    layout: PDF_TABLE_LAYOUTS.bordered,
    margin: [0, 0, 0, 10]
  };
}

function buildIntroParagraph(): any {
  return {
    text: 'We should advise that according to the bill of lading, the details of the following consignment are as follows:',
    bold: true,
    fontSize: 10,
    margin: [0, 0, 0, 4]
  };
}

function buildOutturnParagraph(): any {
  return {
    text: 'However, we have found that the cargo outturned with the following details:',
    bold: true,
    fontSize: 10,
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
          { text: firstHeaderLabel, style: 'tableHeader', alignment: 'center' },
          { text: 'Marks and Numbers', style: 'tableHeader', alignment: 'center' },
          { text: 'Goods Description', style: 'tableHeader', alignment: 'center' }
        ],
        [
          { text: houseJob.hblNo || '', style: 'tableCell', alignment: 'center' },
          { text: houseJob.marksAndNumbers || '', style: 'tableCell' },
          { text: houseJob.goodsDescription || '', style: 'tableCell' }
        ]
      ]
    },
    layout: PDF_TABLE_LAYOUTS.bordered,
    margin: [0, 0, 0, 6]
  };
}

function buildBodyParagraph(): any {
  return {
    text: INDEMNITY_BODY,
    fontSize: 9,
    lineHeight: 1.4,
    margin: [0, 8, 0, 0]
  };
}

function buildKeyValueRow(label: string, value: string, labelWidth = 95): any {
  return {
    columns: [
      { text: label, bold: true, width: labelWidth },
      { text: ':', width: 8 },
      { text: value || '', width: '*' }
    ],
    margin: [0, 0, 0, 3]
  };
}

export function transformImdemintyApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string
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
