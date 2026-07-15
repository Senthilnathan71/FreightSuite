import { QuotationPdfData, QuotationDocumentType } from '../interfaces/pdf-document.interfaces';
import { buildCompanyHeader } from '../builders/pdf-header.builder';
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
    pageMargins: [15, 16, 15, 24],
    background: (_: number, pageSize: any) => ({
      canvas: [
        {
          type: 'rect',
          x: 14,
          y: 14,
          w: pageSize.width - 28,
          h: pageSize.height - 28,
          lineWidth: 0.5,
          lineColor: '#000'
        }
      ]
    }),
    content: [
      buildCompanyHeader(data),
      buildTitle(title),
      buildCustomerInfo(data, isContract),
      buildGreeting(),
      ...buildRouteSections(data),
      buildClosingMessage(),
      buildSignature(data)
    ],
    footer: (currentPage: number, pageCount: number) => buildFooter(data, currentPage, pageCount),
    defaultStyle: {
      fontSize: 8,
      color: '#000'
    }
  };
}

function buildTitle(title: string): any {
  return {
    table: {
      widths: ['*'],
      body: [[{ text: title, bold: true, alignment: 'center', fontSize: 10, margin: [0, 2, 0, 2] }]]
    },
    layout: {
      hLineWidth: (i: number) => (i === 0 ? 0.5 : 0),
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
          { text: q.customerAddress || '', margin: [14, 0, 0, 0], bold: true }
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
    margin: [8, 5, 8, 10]
  };
}

function infoLine(label: string, value: string): any {
  return {
    columns: [
      { text: label, bold: true, width: 72 },
      { text: ':', width: 5 },
      { text: value || '', width: '*' }
    ],
    margin: [52, 0, 0, 0]
  };
}

function buildGreeting(): any {
  return {
    stack: [
      { text: 'Dear Sir/Mam,', bold: true, margin: [10, 4, 0, 4] },
      {
        text: 'Thank you very much for the opportunity to quote for your esteemed organization.\nWe are pleased to submit our best rates as outlined below.',
        bold: false,
        fontSize: 7,
        margin: [10, 0, 0, 6]
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
          { text: deptName, bold: true, margin: [7, 1, 0, 2] },
          { text: routeLabel, bold: true, alignment: 'right', margin: [0, 1, 14, 2] }
        ]]
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#000'
      },
      margin: [0, 0, 0, 0]
    });

    const carriers = route.carriers || [];
    carriers.forEach((carrier: any) => {
      const showCargoTable = shouldShowRouteCargoTable(route, data);
      const showCargoSummary = !shouldShowContainerQuantity(route, data);

      blocks.push(buildRouteInfo(route, carrier));

      // FCL shows the container table instead of weight/volume measurements.
      if (showCargoSummary) {
        blocks.push(buildRouteMeasurements(route, data));
      }

      if (showCargoTable) {
        blocks.push(buildRouteCargoTable(route, data));
      }

      blocks.push(buildChargeTable(carrier?.charges || [], showAgreedRate, data.companyCurrencyCode, data.currencyMaster));
    });

    blocks.push(buildRouteTermsSection(route.terms || []));
    blocks.push({ text: '', margin: [0, 0, 0, 0] });
  });

  return blocks;
}

function buildRouteCargoTable(route: any, data: QuotationPdfData): any {
  const showQuantity = shouldShowContainerQuantity(route, data);
  const cargoDetails = getRoutePrintCargoDetails(route, data);
  const widths = showQuantity
    ? ['18%', '20%', '18%', '18%', '18%']
    : ['25%', '25%', '17%', '17%', '16%'];
  const body: any[] = [[
    { text: 'Cargo Type', bold: true, alignment: 'center' },
    { text: 'Container Type', bold: true, alignment: 'center' },
    ...(showQuantity ? [{ text: 'No of Container', bold: true, alignment: 'center' }] : []),
    { text: 'Gross Wt', bold: true, alignment: 'center' },
    { text: 'Net Wt', bold: true, alignment: 'center' },
  ]];

  cargoDetails.forEach((cargo: any) => {
    body.push([
      { text: cargo?.cargoType || '-', alignment: 'left' },
      { text: cargo?.containerType || '-', alignment: 'left' },
      ...(showQuantity ? [{ text: cargo?.quantity || '-', alignment: 'right' }] : []),
      { text: formatNumeric(cargo?.grossWeight, 3), alignment: 'right' },
      { text: formatNumeric(cargo?.netWeight, 3), alignment: 'right' },
    ]);
  });

  return {
    table: {
      headerRows: 1,
      widths,
      body
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 2,
      paddingBottom: () => 2
    },
    margin: [40, 0, 40, 4]
  };
}

function buildChargeTable(charges: any[], showAgreedRate: boolean, companyCurrencyCode?: string, currencyMaster?: any[]): any {
  const companyDecimals = getAmountDecimals(companyCurrencyCode, currencyMaster);

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
    header.push({ text: `Amt In ${companyCurrencyCode || ''}`.trim(), bold: true, alignment: 'center' });
  }

  const body: any[] = [header];
  (charges || []).forEach((charge: any) => {
    const chargeDecimals = getAmountDecimals(charge?.currency, currencyMaster);
    const row: any[] = [
      { text: charge?.chargeName || '', alignment: 'left' },
      { text: charge?.unit || '', alignment: 'center' },
      { text: formatNumeric(charge?.qty), alignment: 'right' },
      { text: charge?.currency || '', alignment: 'center' }
    ];
    if (showAgreedRate) {
      row.push({
        text: formatNumeric(charge?.exchangeRate, getExchangeRateDecimals(charge?.currency, currencyMaster)),
        alignment: 'right'
      });
    }
    row.push({ text: formatNumeric(charge?.rate, chargeDecimals), alignment: 'right' });
    row.push({ text: formatNumeric(charge?.amount, chargeDecimals), alignment: 'right' });
    if (showAgreedRate) {
      row.push({ text: formatNumeric(charge?.localAmount, companyDecimals), alignment: 'right' });
    }
    body.push(row);
  });

  if (showAgreedRate) {
    const totalLocalAmount = (charges || []).reduce(
      (sum: number, charge: any) => sum + (Number(charge?.localAmount) || 0),
      0
    );
    body.push([
      { text: 'Total', bold: true, alignment: 'right', colSpan: 7 },
      {}, {}, {}, {}, {}, {},
      { text: formatNumeric(totalLocalAmount, companyDecimals), bold: true, alignment: 'right' }
    ]);
  }

  const widths: any[] = showAgreedRate
    ? ['34%', '6%', '8%', '6%', '10%', '10%', '13%', '13%']
    : ['40%', '11%', '9%', '10%', '13%', '17%'];

  return {
    table: {
      headerRows: 1,
      widths,
      body
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: (i: number, node: any) => {
        if (i === 0 || i === node.table.widths.length) return 0;
        return 0.5;
      },
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 3,
      paddingRight: () => 3,
      paddingTop: () => 1,
      paddingBottom: () => 1
    },
    margin: [0, 0, 0, 0]
  };
}

function getTermText(term: any): string {
  if (typeof term === 'string') {
    return term.trim();
  }

  return (term?.content || term?.TandC || term?.Terms || '').trim();
}

function getUniqueTerms(terms: any[]): string[] {
  return (terms || [])
    .map((term: any) => getTermText(term))
    .filter((term: string, index: number, arr: string[]) => !!term && arr.indexOf(term) === index);
}

function buildTermsSection(data: QuotationPdfData): any {
  const termValues = getUniqueTerms(data.terms || []);

  return {
    stack: [
      { text: 'Terms and Conditions', bold: true, fontSize: 8, margin: [10, 10, 0, 2] },
      { ul: termValues, fontSize: 7, margin: [12, 0, 0, 10], lineHeight: 1.4 }
    ]
  };
}

function buildRouteTermsSection(terms: any[]): any {
  const termValues = getUniqueTerms(terms || []);

  if (termValues.length === 0) {
    return { text: '', margin: [0, 0, 0, 0] };
  }

  return {
    stack: [
      { text: 'Terms and Conditions', bold: true, fontSize: 8, margin: [10, 6, 0, 2] },
      { ul: termValues, fontSize: 7, margin: [12, 0, 0, 6], lineHeight: 1.4 }
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

// Decimal places for an amount, taken from the currency master. Falls back to 2.
function getAmountDecimals(currencyCode: string | undefined, currencyMaster: any[] | undefined): number {
  const currency = (currencyMaster || []).find((c: any) => c?.currencyCode === currencyCode);
  const decimals = Number(currency?.amountDecimal);
  return Number.isFinite(decimals) ? decimals : 2;
}

// Decimal places for an exchange rate, taken from the currency master. Falls back to 4.
function getExchangeRateDecimals(currencyCode: string | undefined, currencyMaster: any[] | undefined): number {
  const currency = (currencyMaster || []).find((c: any) => c?.currencyCode === currencyCode);
  const decimals = Number(currency?.exchangeDecimal);
  return Number.isFinite(decimals) ? decimals : 4;
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

function resolveUomCode(list: any[] | undefined, uomMasterSid: any): string {
  if (!uomMasterSid || !list?.length) return '';
  const uom = list.find((item: any) => item?.UOMMasterSid === uomMasterSid);
  return uom?.UOMCode || uom?.UOMName || '';
}

// EnquiryCargo.WeightUnitSid stores an index into the enquiry's hardcoded M/CM/Inch list,
// not a UOMMasterSid — so it maps through here rather than the UOM master.
const DIMENSION_UNITS: ReadonlyArray<{ id: number; name: string }> = [
  { id: 1, name: 'M' },
  { id: 2, name: 'CM' },
  { id: 3, name: 'Inch' }
];

function resolveDimensionUnit(unitSid: any): string {
  const id = Number(unitSid);
  return DIMENSION_UNITS.find(unit => unit.id === id)?.name || '';
}

function sumCargoField(route: any, field: string): number {
  return getRouteCargoGroups(route).reduce((sum: number, cargo: any) => sum + (Number(cargo?.[field]) || 0), 0);
}

function sumProductField(route: any, field: string): number {
  return (route?.products || []).reduce((sum: number, product: any) => sum + (Number(product?.[field]) || 0), 0);
}

function isAirSegment(route: any): boolean {
  const segment = (route?.segmentType || '').toString().toUpperCase();
  if (segment) return segment === 'AIR';
  return (route?.departmentName || '').toLowerCase().includes('air');
}

function getRoutePackageCount(route: any): number {
  // Cargo-level PackageQty is often 0; the real count is carried on each product.
  const productTotal = sumProductField(route, 'packageQty');
  return productTotal || sumCargoField(route, 'noOfPackage');
}

function buildLabeledGrid(cells: Array<{ label: string; value: string } | null>): any {
  const rows: any[] = [];
  for (let i = 0; i < cells.length; i += 3) {
    const group = cells.slice(i, i + 3);
    rows.push({
      columns: [0, 1, 2].map((offset: number) => {
        const cell = group[offset];
        if (!cell) return { text: '', width: '*' };
        return {
          columns: [
            { text: cell.label, bold: true, width: 45 },
            { text: `: ${cell.value}`, width: '*' }
          ],
          width: '*'
        };
      }),
      columnGap: 0,
      margin: [10, 1, 10, 1]
    });
  }

  return { stack: rows, margin: [0, 0, 0, 2] };
}

function buildRouteInfo(route: any, carrier: any): any {
  return buildLabeledGrid([
    { label: 'Carrier', value: carrier?.carrierName || '' },
    { label: 'TT. Days', value: carrier?.transitTime || '' },
    { label: 'Valid', value: `${formatDate(route.effDate)} - ${formatDate(route.expDate)}` }
  ]);
}

function buildRouteMeasurements(route: any, data: QuotationPdfData): any {
  const weightUom = route?.weightUom ? ` ${route.weightUom}` : '';

  const cells: Array<{ label: string; value: string } | null> = [
    { label: 'Cargo Type', value: getRoutePrintCargoTypeSummary(route, data) },
    { label: 'Gross Wt', value: `${formatNumeric(sumCargoField(route, 'grossWeight'), 3)}${weightUom}` },
    isAirSegment(route)
      ? { label: 'Chrg Wt', value: `${formatNumeric(sumCargoField(route, 'chargeableWeight'), 3)}${weightUom}` }
      : { label: 'Net Wt', value: `${formatNumeric(sumCargoField(route, 'netWeight'), 3)}${weightUom}` },
    // CBM only applies to a Sea/LCL department; keep the slot so Dims starts on the next row.
    shouldShowRouteCbm(route, data)
      ? { label: 'CBM', value: formatNumeric(sumCargoField(route, 'volume'), 3) }
      : null
  ];

  const length = sumProductField(route, 'length');
  const width = sumProductField(route, 'width');
  const height = sumProductField(route, 'height');
  if (length || width || height) {
    const dims = `${length || '-'} × ${width || '-'} × ${height || '-'}`;
    cells.push({ label: 'Dims', value: `${dims}${route?.dimUom ? ` ${route.dimUom}` : ''}` });
  }

  const packageCount = getRoutePackageCount(route);
  if (packageCount) {
    cells.push({ label: 'No of Pkgs', value: formatNumeric(packageCount) });
  }

  return buildLabeledGrid(cells);
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

  return matchedType.ContainerName || matchedType.ContainerTypeName || matchedType.ContainerCode || String(containerType);
}

function getRoutePrintCargoDetails(route: any, data: QuotationPdfData): Array<{ cargoType: string; containerType: string; quantity: number | string; grossWeight: number; netWeight: number; cbm: number }> {
  return getRouteCargoGroups(route)
    .map((cargo: any) => ({
      cargoType: cargo?.cargoType || cargo?.CargoType || '',
      containerType: getContainerTypeDisplay(cargo?.containerType ?? cargo?.ContainerType, data),
      quantity: cargo?.qty ?? cargo?.Qty ?? cargo?.noOfContainers ?? cargo?.NoofContainers ?? '',
      grossWeight: Number(cargo?.grossWeight) || 0,
      netWeight: Number(cargo?.netWeight) || 0,
      cbm: Number(cargo?.volume) || 0
    }))
    .filter((cargo: any) => cargo.cargoType || cargo.containerType || cargo.quantity !== '');
}

function shouldShowContainerQuantity(route: any, data: QuotationPdfData): boolean {
  const departmentName = (route?.departmentName || getDepartmentName(route?.departmentSid, data.departments || []) || '').toLowerCase();
  return departmentName.includes('fcl');
}

function normalizeCode(value: any): string {
  return String(value ?? '').trim().toUpperCase();
}

function getCargoModeFromSegment(segment: any): 'FCL' | 'LCL' | 'AIR' | 'ROAD' {
  const normalizedSegment = normalizeCode(segment);
  if (normalizedSegment.includes('FCL')) {
    return 'FCL';
  }
  if (normalizedSegment === 'AIR') {
    return 'AIR';
  }
  if (normalizedSegment === 'ROAD' || normalizedSegment === 'TRANSPORT') {
    return 'ROAD';
  }
  return 'LCL';
}

// Mirrors isFclQuotationSegment()/getRouteCargoMode() in quotation-entry.component.ts.
function getRouteCargoMode(route: any, data: QuotationPdfData): 'FCL' | 'LCL' | 'AIR' | 'ROAD' {
  const department = (data.departments || []).find(
    (dep: any) => Number(dep?.DepartmentMasterSid) === Number(route?.departmentSid)
  );

  if (department) {
    const departmentType = normalizeCode(department?.departmentType);
    if (departmentType === 'SEA') {
      return normalizeCode(department?.FCLLCL) === 'FCL' ? 'FCL' : 'LCL';
    }
    if (departmentType === 'AIR') {
      return 'AIR';
    }
    if (departmentType === 'ROAD' || departmentType === 'TRANSPORT') {
      return normalizeCode(department?.FCLLCL) === 'LCL' ? 'LCL' : 'FCL';
    }
    return getCargoModeFromSegment(departmentType);
  }

  return getCargoModeFromSegment(route?.segmentType);
}

function shouldShowRouteCargoTable(route: any, data: QuotationPdfData): boolean {
  return getRouteCargoMode(route, data) === 'FCL';
}

// CBM applies only to a Sea department whose FCL/LCL setup is LCL.
// Mirrors shouldShowRouteCbm() in quotation-entry.component.ts.
function shouldShowRouteCbm(route: any, data: QuotationPdfData): boolean {
  const department = (data.departments || []).find(
    (dep: any) => Number(dep?.DepartmentMasterSid) === Number(route?.departmentSid)
  );

  if (!department) {
    return false;
  }

  return normalizeCode(department?.departmentType) === 'SEA'
    && normalizeCode(department?.FCLLCL) === 'LCL';
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
    weightUnitList?: any[];
    measurementUnitList?: any[];
  },
  options?: {
    routeTandCMap?: Record<string, any[]>;
    printSettings?: {
      logoPosition: 'left' | 'center' | 'right';
      companyPosition: 'left' | 'center' | 'right';
      companyAlignment: 'left' | 'center' | 'right';
    };
    companyCurrencyCode?: string;
  }
): QuotationPdfData {
  const quotation = apiData || {};
  const routes = quotation.quoteRoute || [];
  const normalizedTerms = getUniqueTerms(quotation.terms || []);

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
    printSettings: options?.printSettings || {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    },
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
      segmentType: route.segmentType || '',
      polSid: route.POLSid,
      podSid: route.PODSid,
      fdpSid: route.FDPSid || route.FPODSid,
      effDate: route.effDate,
      expDate: route.expdate || route.expDate,
      carriers: (route.quoteCarrier || []).map((carrier: any) => ({
        carrierName: carrier.CarrierName || '',
        transitTime: carrier.TransitTime || '',
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
        noOfContainers: cargo.Qty ?? cargo.NoofContainers ?? 0,
        grossWeight: Number(cargo.GrossWeight) || 0,
        netWeight: Number(cargo.NetWeight) || 0,
        volume: Number(cargo.Volume) || 0,
        chargeableWeight: Number(cargo.ChargeableWeight) || 0,
        noOfPackage: Number(cargo.PackageQty) || 0
      })),
      terms: (options?.routeTandCMap?.[String(route.QuoteRouteSid)] || []).map((term: any) => ({
        content: getTermText(term)
      })),
      products: (route.quoteCargo || []).flatMap((cargo: any) =>
        (cargo.quoteProduct || cargo.quoteProducts || cargo.products || []).map((product: any) => ({
          length: Number(product.Length) || 0,
          width: Number(product.Width) || 0,
          height: Number(product.Height) || 0,
          packageQty: Number(product.ExternalQty) || 0
        }))
      ),
      weightUom: resolveUomCode(lookups?.weightUnitList, (route.quoteCargo || [])[0]?.WeightUnitSid),
      dimUom: resolveDimensionUnit((route.quoteCargo || [])[0]?.WeightUnitSid)
    })),
    terms: normalizedTerms.map((term: string) => ({
      content: term
    })),
    companyCurrencyCode: options?.companyCurrencyCode || '',
    currencyMaster: lookups?.currencyMaster || [],
    chargeUnitMaster: lookups?.chargeUnitMaster || [],
    departments: lookups?.departments || [],
    ports: lookups?.ports || [],
    containerTypeList: lookups?.containerTypeList || []
  };
}
