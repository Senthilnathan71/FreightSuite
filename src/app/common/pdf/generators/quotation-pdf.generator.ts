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

    // Department | Valid | ports, matching the preview's route header row.
    blocks.push({
      table: {
        widths: ['20%', '40%', '40%'],
        body: [[
          { text: deptName, bold: true, margin: [7, 1, 0, 2] },
          {
            columns: [
              { text: 'Valid', bold: true, width: 40 },
              { text: `: ${formatDate(route.effDate)} - ${formatDate(route.expDate)}`, width: '*' }
            ],
            margin: [0, 1, 0, 2]
          },
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
    const showCargoTable = shouldShowRouteCargoTable(route, data);
    const showCargoSummary = !shouldShowContainerQuantity(route, data);

    // The cargo table describes the route, so it prints once above the carriers rather than
    // repeating per carrier — the preview does the same via its isFirstCarrier guard.
    if (carriers.length) {
      // FCL shows the container table instead of the per-product cargo table.
      if (showCargoSummary) {
        blocks.push(buildRouteProductTable(route, data));
      }

      if (showCargoTable) {
        blocks.push(buildRouteCargoTable(route, data));
      }
    }

    carriers.forEach((carrier: any) => {
      blocks.push(buildRouteInfo(route, carrier));
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

function getApiCargoProducts(cargo: any): any[] {
  return cargo?.quoteProduct || cargo?.quoteProducts || cargo?.products || [];
}

// IsHaz / IsStackable are Char(1) 'Y'/'N' from the API but booleans in the entry form.
function isYesFlag(value: any): boolean {
  return value === true || value === 'Y' || value === 'y' || value === 1 || value === '1';
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

// Valid belongs to the route, so it prints in the route header; this row is per carrier.
function buildRouteInfo(route: any, carrier: any): any {
  return buildLabeledGrid([
    { label: 'Carrier', value: carrier?.carrierName || '' },
    { label: 'TT. Days', value: carrier?.transitTime || '' },
    null
  ]);
}

interface QuotationPrintRow {
  cargoType: string;
  commodity: string;
  packageType: string;
  noOfPackage: number;
  dimensions: string;
  grossWeight: number;
  netWeight: number;
  cbmOrChargeable: number;
  haz: string;
  stackable: string;
}

function formatPrintDimensions(product: any, dimUom: string): string {
  const length = Number(product?.length) || 0;
  const width = Number(product?.width) || 0;
  const height = Number(product?.height) || 0;

  if (!length && !width && !height) {
    return '';
  }

  return `${length || '-'} × ${width || '-'} × ${height || '-'}${dimUom ? ` ${dimUom}` : ''}`;
}

/**
 * One row per PRODUCT, not per cargo: Commodity, Pkg Type, No. of Pkg, Dim, Haz and Stackable
 * only exist on QuoteProduct — QuoteCargo has no column for any of them. The parent cargo
 * supplies Cargo Type and the fallback weights. Mirrors getRoutePrintProductRows() in
 * quotation-entry.component.ts so the preview and the PDF stay identical.
 */
function getRoutePrintProductRows(route: any, data: QuotationPdfData): QuotationPrintRow[] {
  const isAir = getRouteCargoMode(route, data) === 'AIR';
  const dimUom = route?.dimUom || '';
  const rows: QuotationPrintRow[] = [];

  getRouteCargoGroups(route).forEach((cargo: any) => {
    const products = cargo?.products || [];

    if (!products.length) {
      rows.push({
        cargoType: cargo?.cargoType || '',
        commodity: cargo?.productName || '',
        packageType: cargo?.packageType || '',
        noOfPackage: Number(cargo?.packageQty) || 0,
        dimensions: '',
        grossWeight: Number(cargo?.grossWeight) || 0,
        netWeight: Number(cargo?.netWeight) || 0,
        cbmOrChargeable: Number(isAir ? cargo?.chargeableWeight : cargo?.volume) || 0,
        haz: '',
        stackable: ''
      });
      return;
    }

    // With a single product the cargo weights are the same figures, so fall back to them when
    // the product line is blank. With several products that fallback would repeat the whole
    // cargo weight on every row, so the product values stand alone.
    const single = products.length === 1;
    const weight = (productValue: any, cargoValue: any) =>
      Number(productValue) || (single ? Number(cargoValue) || 0 : 0);

    products.forEach((product: any) => {
      rows.push({
        cargoType: cargo?.cargoType || '',
        commodity: product?.productName || cargo?.productName || '',
        packageType: product?.packageType || cargo?.packageType || '',
        noOfPackage: Number(product?.externalQty) || (single ? Number(cargo?.packageQty) || 0 : 0),
        dimensions: formatPrintDimensions(product, dimUom),
        grossWeight: weight(product?.grossWeight, cargo?.grossWeight),
        netWeight: weight(product?.netWeight, cargo?.netWeight),
        cbmOrChargeable: isAir
          ? weight(product?.chargeableWeight, cargo?.chargeableWeight)
          : weight(product?.volume, cargo?.volume),
        haz: product?.isHaz ? 'Y' : 'N',
        stackable: product?.isStackable ? 'Y' : 'N'
      });
    });
  });

  return rows;
}

function buildRouteProductTable(route: any, data: QuotationPdfData): any {
  const rows = getRoutePrintProductRows(route, data);
  const isAir = getRouteCargoMode(route, data) === 'AIR';
  // An all-blank Dim column is noise, so it only prints when some row carries dimensions.
  const showDim = rows.some((row: QuotationPrintRow) => !!row.dimensions);

  const header = [
    'Cargo Type', 'Commodity', 'Pkg Type', 'No. of Pkg',
    ...(showDim ? ['Dim'] : []),
    'G. Weight', 'Net Wt', isAir ? 'Chrg Wt' : 'CBM', 'Haz', 'Non-Stack.'
  ].map((text: string) => ({ text, bold: true, alignment: 'center', fontSize: 7 }));

  const body: any[] = [header];

  rows.forEach((row: QuotationPrintRow) => {
    body.push([
      { text: row.cargoType || '-', alignment: 'left', fontSize: 7 },
      { text: row.commodity || '-', alignment: 'left', fontSize: 7 },
      { text: row.packageType || '-', alignment: 'left', fontSize: 7 },
      { text: formatNumeric(row.noOfPackage), alignment: 'right', fontSize: 7 },
      ...(showDim ? [{ text: row.dimensions || '-', alignment: 'left', fontSize: 7 }] : []),
      { text: formatNumeric(row.grossWeight, 3), alignment: 'right', fontSize: 7 },
      { text: formatNumeric(row.netWeight, 3), alignment: 'right', fontSize: 7 },
      { text: formatNumeric(row.cbmOrChargeable, 3), alignment: 'right', fontSize: 7 },
      { text: row.haz || '-', alignment: 'center', fontSize: 7 },
      { text: row.stackable || '-', alignment: 'center', fontSize: 7 }
    ]);
  });

  if (rows.length) {
    const total = (field: 'noOfPackage' | 'grossWeight' | 'netWeight' | 'cbmOrChargeable') =>
      rows.reduce((sum: number, row: QuotationPrintRow) => sum + (Number(row[field]) || 0), 0);
    const totalPackages = total('noOfPackage');

    // The label stops at Pkg Type so No. of Pkg can carry its own total. pdfmake still needs a
    // placeholder cell for every column a colSpan swallows.
    body.push([
      { text: 'Total', bold: true, alignment: 'right', colSpan: 3, fontSize: 7 },
      {}, {},
      { text: totalPackages ? formatNumeric(totalPackages) : '-', bold: true, alignment: 'right', fontSize: 7 },
      ...(showDim ? [{}] : []),
      { text: formatNumeric(total('grossWeight'), 3), bold: true, alignment: 'right', fontSize: 7 },
      { text: formatNumeric(total('netWeight'), 3), bold: true, alignment: 'right', fontSize: 7 },
      { text: formatNumeric(total('cbmOrChargeable'), 3), bold: true, alignment: 'right', fontSize: 7 },
      { text: '', colSpan: 2 },
      {}
    ]);
  }

  return {
    table: {
      headerRows: 1,
      widths: showDim
        ? ['9%', '13%', '8%', '9%', '14%', '11%', '11%', '10%', '7%', '8%']
        : ['10%', '20%', '8%', '11%', '13%', '13%', '12%', '5%', '8%'],
      body
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#000',
      vLineColor: () => '#000',
      paddingLeft: () => 3,
      paddingRight: () => 3,
      paddingTop: () => 2,
      paddingBottom: () => 2
    },
    margin: [10, 0, 10, 4]
  };
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
    packageTypes?: any[];
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
        noOfPackage: Number(cargo.PackageQty) || 0,
        productName: cargo.ProductName || '',
        packageType: cargo.PackageType || '',
        packageQty: Number(cargo.PackageQty) || 0,
        products: getApiCargoProducts(cargo).map((product: any) => ({
          productName: product.ProductName || '',
          // The Pkg Type dropdown writes ExternalPkg (a UOMMasterSid); PackageType is null on
          // any quotation not converted from an enquiry, so resolve the id first.
          packageType: resolveUomCode(lookups?.packageTypes, product.ExternalPkg) || product.PackageType || '',
          externalQty: Number(product.ExternalQty) || 0,
          length: Number(product.Length) || 0,
          width: Number(product.Width) || 0,
          height: Number(product.Height) || 0,
          grossWeight: Number(product.GrossWeight) || 0,
          netWeight: Number(product.NetWeight) || 0,
          volume: Number(product.Volume) || 0,
          chargeableWeight: Number(product.ChargeableWeight) || 0,
          isHaz: isYesFlag(product.IsHaz),
          isStackable: isYesFlag(product.IsStackable)
        }))
      })),
      terms: (options?.routeTandCMap?.[String(route.QuoteRouteSid)] || []).map((term: any) => ({
        content: getTermText(term)
      })),
      products: (route.quoteCargo || []).flatMap((cargo: any) =>
        getApiCargoProducts(cargo).map((product: any) => ({
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
