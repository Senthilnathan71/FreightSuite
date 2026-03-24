import { ExitFormPdfData } from '../interfaces/pdf-document.interfaces';

const MM_TO_PT = 2.8346456693;

function mm(value: number): number {
  return value * MM_TO_PT;
}

function safeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function formatDateParts(value?: Date | string): { day: string; month: string; year: string } {
  if (!value) {
    return { day: '', month: '', year: '' };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: '', month: '', year: '' };
  }

  const dateOnly = date.toISOString().split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  return { day, month, year };
}

function positionedText(
  text: string,
  leftMm: number,
  topMm: number,
  options?: {
    bold?: boolean;
    fontSize?: number;
    widthMm?: number;
  },
): any {
  return {
    text,
    bold: options?.bold ?? true,
    fontSize: options?.fontSize ?? 11,
    absolutePosition: { x: mm(leftMm), y: mm(topMm) },
    ...(options?.widthMm ? { width: mm(options.widthMm) } : {}),
  };
}

export function generateExitFormDocument(data: ExitFormPdfData): any {
  const hblDateParts = formatDateParts(data.hblDate);

  const quantityItems = (data.quantities || []).map((quantity, index) =>
    positionedText(quantity, 20, 145 + index * 6, {
      bold: true,
      fontSize: 11,
    }),
  );

  return {
    pageSize: {
      width: mm(280),
      height: mm(400),
    },
    pageMargins: [0, 0, 0, 0],
    content: [
      positionedText(data.exporterName || '', 30, 58, { widthMm: 150 }),
      positionedText(hblDateParts.day, 210, 60, { fontSize: 10, bold: false }),
      positionedText(hblDateParts.month, 226, 60, { fontSize: 10, bold: false }),
      positionedText(hblDateParts.year, 242, 60, { fontSize: 10, bold: false }),

      positionedText(hblDateParts.day, 113, 90, { fontSize: 10, bold: false }),
      positionedText(hblDateParts.month, 127, 90, { fontSize: 10, bold: false }),
      positionedText(hblDateParts.year, 142, 90, { fontSize: 10, bold: false }),
      positionedText(data.hblNo || '', 188, 90, { widthMm: 60 }),

      positionedText(data.countryOfOrigin || '', 10, 110, { widthMm: 70 }),
      positionedText(data.pointOfExit || '', 105, 110, { widthMm: 70 }),
      positionedText(data.destination || '', 200, 110, { widthMm: 60 }),

      ...quantityItems,

      positionedText(data.commodityDescription || '', 60, 145, { widthMm: 180 }),

      positionedText(data.totalQuantity || '', 30, 225, { widthMm: 50 }),
      positionedText(data.totalWeight || '', 110, 225, { widthMm: 60 }),

      positionedText(data.containerNumbers || '', 10, 255, {
        widthMm: 95,
        fontSize: 10,
      }),
      positionedText(data.customsSealNumbers || '', 112, 255, {
        widthMm: 85,
        fontSize: 10,
      }),
    ],
    defaultStyle: {
      fontSize: 10,
      color: '#000000',
    },
  };
}

export function transformExitFormApiData(
  apiData: any,
  company: any,
  branch: any,
  userData: any,
  logo?: string,
): ExitFormPdfData {
  const products = Array.isArray(apiData?.Products) ? apiData.Products : [];
  const cargo = Array.isArray(apiData?.Cargo) ? apiData.Cargo : [];
  const containers = Array.isArray(apiData?.masterJob?.containers)
    ? apiData.masterJob.containers
    : [];

  return {
    company: {
      companyName: company?.companyName || company?.CompanyName || '',
      addressLine1: company?.addressLine1 || company?.Address || '',
      addressLine2: company?.addressLine2 || '',
      city: company?.city || company?.City || '',
      postalCode: company?.postalCode || company?.postal_code || '',
      phoneNumber: company?.phoneNumber || company?.Phone || '',
    },
    branch: {
      branchName: branch?.branchName || branch?.BranchName || '',
      addressLine1: branch?.addressLine1 || branch?.Address || '',
      addressLine2: branch?.addressLine2 || '',
      cityName: branch?.cityMaster?.cityName || branch?.cityName || '',
      postalCode: branch?.postalCode || '',
      phoneNumber: branch?.phoneNumber || '',
      cityMaster: branch?.cityMaster,
    },
    userData: {
      userName: userData?.userName || userData?.UserName || '',
      email: userData?.email || userData?.Email || '',
    },
    logo,
    reportTitle: 'Exit Form',
    exporterName: apiData?.ShipperName || '',
    hblNo: apiData?.HBLNo || '',
    hblDate: apiData?.HBLDate,
    countryOfOrigin: userData?.countryMaster?.countryCode || '',
    pointOfExit: apiData?.POL || '',
    destination: apiData?.FPD || '',
    quantities: products
      .map((item: any) => safeText(item?.ExternlQty))
      .filter((value: string) => !!value),
    commodityDescription: cargo?.[0]?.CommodityDescription || '',
    totalQuantity: safeText(cargo?.[0]?.NoOfPackage),
    totalWeight: safeText(cargo?.[0]?.GrossWeight),
    containerNumbers: products
      .map((item: any) => safeText(item?.ContainerNo))
      .filter((value: string) => !!value)
      .join(', '),
    customsSealNumbers: containers
      .map((item: any) => safeText(item?.CustomsSeal))
      .filter((value: string) => !!value)
      .join(', '),
  };
}
