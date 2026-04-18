import { QuotationPdfData, QuotationDocumentType } from '../interfaces/pdf-document.interfaces';
import { formatDate, getDepartmentName, getFormattedPort } from '../helpers/pdf-formatters';

export function generateQuotationDocument(
  data: QuotationPdfData,
  documentType: QuotationDocumentType = 'quotation'
): any {
  const isContract = documentType === 'contract' || data.quotation?.isContract;
  const title = isContract ? 'Contract' : 'Quotation';

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [15, 20, 15, 28],
    background: (_: number, pageSize: any) => ({
      canvas: [
        {
          type: 'rect',
          x: 14,
          y: 14,
          w: pageSize.width - 28,
          h: pageSize.height - 28,
          lineWidth: 1,
          lineColor: '#000'
        }
      ]
    }),
    content: [
      buildHeader(data),
      buildTitle(title),
      buildCustomerInfo(data, isContract),
      buildGreeting(),
      ...buildRouteSections(data),
      buildTermsSection(data),
      buildClosingMessage(),
      buildSignature(data)
    ],
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    defaultStyle: {
      fontSize: 10,
      color: '#000'
    }
  };
}

function buildHeader(data: QuotationPdfData): any {
  const company: any = data.company || {};
  const branch: any = data.branch || {};
  const settings: any = (data as any)?.printSettings || {};
  const logoPosition: 'left' | 'center' | 'right' = settings.logoPosition || 'left';
  const companyPosition: 'left' | 'center' | 'right' = settings.companyPosition || 'center';
  const companyAlignment: 'left' | 'center' | 'right' = settings.companyAlignment || 'center';

  const detailLine1 = branch?.addressLine1 || company?.addressLine1 || '';
  const detailLine2 = [
    branch?.addressLine2 || company?.addressLine2 || '',
    branch?.cityName || company?.city || '',
    (branch?.postalCode || company?.postalCode) ? `Postal Code : ${branch?.postalCode || company?.postalCode}` : '',
    (branch?.phoneNumber || company?.phoneNumber) ? `Ph.no : ${branch?.phoneNumber || company?.phoneNumber}` : ''
  ]
    .filter(Boolean)
    .join(', ');

  const companyDetails = {
    stack: [
      { text: (company?.companyName || 'XXXX COMPANY NAME').toUpperCase(), bold: true, fontSize: 14, alignment: companyAlignment },
      { text: branch?.branchName || 'XXXX BRANCH NAME', bold: true, fontSize: 11, alignment: companyAlignment, margin: [0, 1, 0, 0] },
      { text: detailLine1, fontSize: 9, alignment: companyAlignment, margin: [0, 1, 0, 0] },
      { text: detailLine2, fontSize: 9, alignment: companyAlignment, margin: [0, 1, 0, 0] }
    ],
    margin: [0, 0, 0, 0]
  };

  return {
    columns: [
      {
        width: '*',
        stack: [
          logoPosition === 'left'
            ? buildHeaderLogo(data.logo, 'left')
            : { text: '' },
          companyPosition === 'left'
            ? companyDetails
            : { text: '' }
        ]
      },
      {
        width: '*',
        stack: [
          logoPosition === 'center'
            ? buildHeaderLogo(data.logo, 'center')
            : { text: '' },
          companyPosition === 'center'
            ? companyDetails
            : { text: '' }
        ]
      },
      {
        width: '*',
        stack: [
          logoPosition === 'right'
            ? buildHeaderLogo(data.logo, 'right')
            : { text: '' },
          companyPosition === 'right'
            ? companyDetails
            : { text: '' }
        ]
      }
    ],
    margin: [0, 0, 0, 2]
  };
}

function buildHeaderLogo(logo: string | undefined, alignment: 'left' | 'center' | 'right'): any {
  if (!logo) {
    return { text: '' };
  }

  return {
    image: logo,
    fit: [60, 60],
    alignment,
    margin: [4, 0, 0, 0]
  };
}

function buildTitle(title: string): any {
  return {
    table: {
      widths: ['*'],
      body: [[{ text: title, bold: true, alignment: 'center', fontSize: 16, margin: [0, 4, 0, 4] }]]
    },
    layout: {
      hLineWidth: (i: number) => (i === 0 ? 1 : 0),
      vLineWidth: () => 0,
      hLineColor: () => '#000'
    },
    margin: [0, 0, 0, 0]
  };
}

function buildCustomerInfo(data: QuotationPdfData, isContract: boolean): any {
  const q = data.quotation || {};
  const docType = isContract ? 'Contract' : 'Quotation';

  return {
    columns: [
      {
        width: '40%',
        stack: [
          { text: 'To', bold: true, margin: [0, 0, 0, 2] },
          { text: q.customerName || '', margin: [14, 0, 0, 1], bold: true },
          { text: q.customerAddress || '', margin: [14, 0, 0, 0] }
        ]
      },
      {
        width: '60%',
        stack: [
          infoLine(`${docType} No.`, q.quoteNumber || ''),
          infoLine(`${docType} Date`, formatDate(q.quoteDate)),
          infoLine('Reference', q.customerRef || '')
        ],
        margin: [20, 0, 0, 0]
      }
    ],
    columnGap: 4,
    margin: [8, 8, 8, 0]
  };
}

function infoLine(label: string, value: string): any {
  return {
    columns: [
      { text: label, bold: true, width: 92 },
      { text: ':', width: 8 },
      { text: value || '', width: '*' }
    ],
    margin: [52, 0, 0, 0]
  };
}

function buildGreeting(): any {
  return {
    stack: [
      { text: 'Dear Sir/Mam,', bold: true, margin: [10, 6, 0, 2] },
      {
        text: 'Thank you very much for the opportunity to quote for your esteemed organization.\nWe are pleased to submit our best rates as outlined below.',
        margin: [10, 0, 0, 10]
      }
    ]
  };
}

function buildRouteSections(data: QuotationPdfData): any[] {
  const routes = data.routes || [];
  const showAgreedRate = data.quotation?.agreedRate === true;
  const blocks: any[] = [];

  routes.forEach((route: any) => {
    const deptName = route.departmentName || getDepartmentName(route.departmentSid, data.departments || []);
    const pol = getFormattedPort(route.polSid, data.ports || []);
    const pod = getFormattedPort(route.podSid, data.ports || []);
    const fdp = route.fdpSid && route.fdpSid !== route.podSid ? getFormattedPort(route.fdpSid, data.ports || []) : '';
    const routeLabel = `${pol} - ${pod}${fdp ? ` - ${fdp}` : ''}`;

    blocks.push({
      table: {
        widths: ['20%', '80%'],
        body: [[
          { text: deptName, bold: true, margin: [10, 2, 0, 4] },
          { text: routeLabel, bold: true, alignment: 'right', margin: [0, 2, 14, 4] }
        ]]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 0,
        hLineColor: () => '#000'
      },
      margin: [0, 0, 0, 0]
    });

    const carriers = route.carriers || [];
    carriers.forEach((carrier: any) => {
      const showCargoTable = shouldShowRouteCargoTable(route, data);
      const showCargoSummary = !shouldShowContainerQuantity(route, data);

      blocks.push({
        columns: [
          { text: [{ text: 'Carrier : ', bold: true }, carrier?.carrierName || ''], width: '25%', margin: [10, 4, 0, 4] },
          showCargoSummary
            ? { text: [{ text: 'Cargo Type : ', bold: true }, getRoutePrintCargoTypeSummary(route, data)], width: '25%', margin: [0, 4, 0, 4] }
            : { text: '', width: '25%', margin: [0, 4, 0, 4] },
          { text: [{ text: 'Valid From : ', bold: true }, formatDate(route.effDate)], width: '25%', margin: [0, 4, 0, 4] },
          { text: [{ text: 'Valid To : ', bold: true }, formatDate(route.expDate)], width: '25%', alignment: 'right', margin: [0, 4, 10, 4] }
        ],
        columnGap: 0
      });

      if (showCargoTable) {
        blocks.push(buildRouteCargoTable(route, data));
      }

      blocks.push(buildChargeTable(carrier?.charges || [], showAgreedRate));
    });

    blocks.push({ text: '', margin: [0, 0, 0, 0] });
  });

  return blocks;
}

function buildRouteCargoTable(route: any, data: QuotationPdfData): any {
  const showQuantity = shouldShowContainerQuantity(route, data);
  const cargoDetails = getRoutePrintCargoDetails(route, data);
  const widths = showQuantity ? ['33%', '33%', '34%'] : ['50%', '50%'];
  const body: any[] = [[
    { text: 'Cargo Type', bold: true, alignment: 'left' },
    { text: 'Container Type', bold: true, alignment: 'left' },
    ...(showQuantity ? [{ text: 'No Of Container', bold: true, alignment: 'center' }] : [])
  ]];

  cargoDetails.forEach((cargo: any) => {
    body.push([
      { text: cargo?.cargoType || '-', alignment: 'left' },
      { text: cargo?.containerType || '-', alignment: 'left' },
      ...(showQuantity ? [{ text: cargo?.quantity || '-', alignment: 'center' }] : [])
    ]);
  });

  return {
    table: {
      headerRows: 1,
      widths,
      body
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5
    },
    margin: [55, 0, 55, 8]
  };
}

function buildChargeTable(charges: any[], showAgreedRate: boolean): any {
  const header: any[] = [
    { text: 'Charge', bold: true, alignment: 'center' },
    { text: 'Unit', bold: true, alignment: 'center' },
    { text: 'Qty.', bold: true, alignment: 'center' },
    { text: 'Curr.', bold: true, alignment: 'center' }
  ];
  if (showAgreedRate) {
    header.push({ text: 'Ex Rate', bold: true, alignment: 'center' });
  }
  header.push({ text: 'Rate', bold: true, alignment: 'center' });
  header.push({ text: 'Amt', bold: true, alignment: 'center' });
  if (showAgreedRate) {
    header.push({ text: 'Local Amt', bold: true, alignment: 'center' });
  }

  const body: any[] = [header];
  (charges || []).forEach((charge: any) => {
    const row: any[] = [
      { text: charge?.chargeName || '', alignment: 'left' },
      { text: charge?.unit || '', alignment: 'left' },
      { text: formatNumeric(charge?.qty), alignment: 'right' },
      { text: charge?.currency || '', alignment: 'left' }
    ];
    if (showAgreedRate) {
      row.push({ text: formatNumeric(charge?.exchangeRate, 3), alignment: 'right' });
    }
    row.push({ text: formatNumeric(charge?.rate, 3), alignment: 'right' });
    row.push({ text: formatNumeric(charge?.amount, 3), alignment: 'right' });
    if (showAgreedRate) {
      row.push({ text: formatNumeric(charge?.localAmount, 3), alignment: 'right' });
    }
    body.push(row);
  });

  const widths: any[] = showAgreedRate
    ? ['34%', '10%', '8%', '8%', '10%', '10%', '10%', '10%']
    : ['40%', '11%', '9%', '10%', '13%', '17%'];

  return {
    table: {
      headerRows: 1,
      widths,
      body
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: (i: number, node: any) => {
        if (i === 0 || i === node.table.widths.length) return 0;
        return 1;
      },
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3
    },
    margin: [0, 0, 0, 0]
  };
}

function buildTermsSection(data: QuotationPdfData): any {
  const termValues = (data.terms || [])
    .map((term: any) => (typeof term === 'string' ? term : (term?.content || term?.TandC || '')))
    .filter((value: string) => !!value);

  // if (!termValues.length) {
  //   return { text: '' };
  // }

  return {
    stack: [
      { text: 'Terms and Conditions', bold: true, margin: [10, 2, 0, 2] },
      { ul: termValues, margin: [12, 0, 0, 10] }
    ]
  };
}

function buildClosingMessage(): any {
  return {
    text: 'We kindly look forward to your valuable support regarding the above shipment.',
    bold: true,
    margin: [10, 0, 0, 10]
  };
}

function buildSignature(data: QuotationPdfData): any {
  return {
    stack: [
      { text: 'Best Regards', bold: true, margin: [10, 0, 0, 4] },
      {
        columns: [
          { text: 'Name', bold: true, width: 70 },
          { text: ':', width: 10 },
          { text: data.userData?.userName || '', width: '*' }
        ],
        margin: [10, 0, 0, 2]
      },
      {
        columns: [
          { text: 'Company', bold: true, width: 70 },
          { text: ':', width: 10 },
          { text: data.company?.companyName || 'Company Name', width: '*' }
        ],
        margin: [10, 0, 0, 0]
      }
    ]
  };
}

function buildFooter(data: QuotationPdfData, currentPage: number, pageCount: number): any {
  return {
    margin: [24, 0, 24, 2],
    columns: [
      { text: `Printed By : ${data.userData?.userName || ''}`, alignment: 'left', width: '25%', fontSize: 7 },
      { text: 'This document is computer-generated and does not require a signature.', alignment: 'center', width: '*', fontSize: 7, noWrap: true },
      { text: `Printed On : ${formatDate(new Date())}  Page: ${currentPage} of ${pageCount}`, alignment: 'right', width: '30%', fontSize: 7 }
    ]
  };
}

function formatNumeric(value: any, precision: number = 0): string {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
}

function getRouteCargoGroups(route: any): any[] {
  if (!route) return [];
  if (Array.isArray(route.cargo) && route.cargo.length > 0) return route.cargo;
  return route.cargo ? [route.cargo] : [];
}

function getContainerTypeDisplay(containerType: any, data: QuotationPdfData): string {
  if (containerType === null || containerType === undefined || containerType === '') {
    return '';
  }

  const matchedType = (data.containerTypeList || []).find((type: any) =>
    type?.ContainerTypeMasterSid === containerType ||
    String(type?.ContainerTypeMasterSid) === String(containerType) ||
    type?.ContainerCode === containerType ||
    type?.ContainerName === containerType
  );

  if (!matchedType) {
    return String(containerType);
  }

  return matchedType.ContainerCode || matchedType.ContainerName || String(containerType);
}

function getRoutePrintCargoDetails(route: any, data: QuotationPdfData): Array<{ cargoType: string; containerType: string; quantity: number | string }> {
  return getRouteCargoGroups(route)
    .map((cargo: any) => ({
      cargoType: cargo?.cargoType || cargo?.CargoType || '',
      containerType: getContainerTypeDisplay(cargo?.containerType ?? cargo?.ContainerType, data),
      quantity: cargo?.qty ?? cargo?.Qty ?? cargo?.noOfContainers ?? cargo?.NoofContainers ?? ''
    }))
    .filter((cargo: any) => cargo.cargoType || cargo.containerType || cargo.quantity !== '');
}

function shouldShowContainerQuantity(route: any, data: QuotationPdfData): boolean {
  const departmentName = (route?.departmentName || getDepartmentName(route?.departmentSid, data.departments || []) || '').toLowerCase();
  return departmentName.includes('fcl');
}

function shouldShowRouteCargoTable(route: any, data: QuotationPdfData): boolean {
  return shouldShowContainerQuantity(route, data) && getRoutePrintCargoDetails(route, data).length > 0;
}

function getRoutePrintCargoTypeSummary(route: any, data: QuotationPdfData): string {
  const cargoTypes = getRoutePrintCargoDetails(route, data)
    .map((cargo: any) => cargo?.cargoType)
    .filter((cargoType: string) => !!cargoType);

  return cargoTypes.length ? Array.from(new Set(cargoTypes)).join(', ') : '-';
}

export function transformQuotationApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
  lookups?: {
    currencyMaster?: any[];
    chargeUnitMaster?: any[];
    departments?: any[];
    ports?: any[];
    containerTypeList?: any[];
  }
): QuotationPdfData {
  const quotation = apiData || {};
  const routes = quotation.quoteRoute || [];

  return {
    company: {
      companyName: company?.companyName || '',
      addressLine1: company?.addressLine1 || company?.Address || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.City || '',
      postalCode: company?.postal_code || company?.ZipCode || '',
      phoneNumber: company?.phoneNumber || company?.Phone || ''
    },
    branch: {
      branchName: branch?.branchName || '',
      addressLine1: branch?.addressLine1 || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || '',
      postalCode: branch?.postalCode || branch?.ZipCode || '',
      phoneNumber: branch?.phoneNumber || branch?.Phone || '',
      cityMaster: branch?.cityMaster
    },
    userData: {
      userName: userData?.userName || '',
      email: userData?.email || ''
    },
    logo,
    quotation: {
      quoteNumber: quotation.QuoteNumber || '',
      quoteDate: quotation.QuoteDate,
      customerRef: quotation.CustomerRef || '',
      customerName: quotation.CustomerName || '',
      customerAddress: quotation.CustomerAddress || '',
      isContract: quotation.IsContract === 'Y',
      agreedRate: quotation.AgreedRate === 'Y'
    },
    routes: routes.map((route: any) => ({
      departmentSid: route.DepartmentMasterSid,
      departmentName: route.departmentMaster?.departmentName || '',
      polSid: route.POLSid,
      podSid: route.PODSid,
      fdpSid: route.FDPSid || route.FPODSid,
      effDate: route.effDate,
      expDate: route.expdate || route.expDate,
      carriers: (route.quoteCarrier || []).map((carrier: any) => ({
        carrierName: carrier.CarrierName || '',
        charges: (carrier.quoteCharge || []).map((charge: any) => ({
          chargeName: charge.ChargeDisplayName || '',
          unit: (lookups?.chargeUnitMaster || []).find((u: any) => u.UOMMasterSid === charge.RevenueChargeUomSid)?.UOMCode || '',
          qty: charge.Qty || 0,
          currency: (lookups?.currencyMaster || []).find((c: any) => c.CurrencyMasterSid === charge.RevenueCurrencyMasterSid)?.currencyCode || '',
          exchangeRate: charge.RevenueExchangeRate,
          rate: charge.RevenueRate || 0,
          amount: charge.RevenueAmount || 0,
          localAmount: charge.RevenueLocalAmount
        }))
      })),
      cargo: (route.quoteCargo || []).map((cargo: any) => ({
        cargoType: cargo.CargoType || '',
        containerType: cargo.ContainerType,
        noOfContainers: cargo.Qty ?? cargo.NoofContainers ?? 0
      }))
    })),
    terms: (quotation.terms || []).map((term: any) => ({
      content: term?.TandC || term?.content || ''
    })),
    currencyMaster: lookups?.currencyMaster || [],
    chargeUnitMaster: lookups?.chargeUnitMaster || [],
    departments: lookups?.departments || [],
    ports: lookups?.ports || [],
    containerTypeList: lookups?.containerTypeList || []
  };
}
