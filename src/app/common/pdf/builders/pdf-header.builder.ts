/**
 * PDF Header Builder
 * Builds company header with logo, company name, branch, and address
 */

import { PdfCompanyInfo, PdfBranchInfo, PdfDocumentBase } from '../interfaces/pdf-base.interface';
import { joinNonEmpty } from '../helpers/pdf-formatters';

export interface HeaderOptions {
  showLogo?: boolean;
  logoWidth?: number;
  logoHeight?: number;
  alignment?: 'left' | 'center' | 'right';
  showBranch?: boolean;
  showAddress?: boolean;
  showPhone?: boolean;
  showPostalPhoneLabels?: boolean;
  compact?: boolean;
}

const DEFAULT_OPTIONS: HeaderOptions = {
  showLogo: true,
  logoWidth: 60,
  logoHeight: 60,
  alignment: 'center',
  showBranch: true,
  showAddress: true,
  showPhone: true,
  showPostalPhoneLabels: false,
  compact: false
};

type HeaderPosition = 'left' | 'center' | 'right';

export interface CompanyHeaderPrintSettings {
  logoPosition: HeaderPosition;
  companyPosition: HeaderPosition;
  companyAlignment: HeaderPosition;
}

export interface CompanyHeaderData extends PdfDocumentBase {
  printSettings?: CompanyHeaderPrintSettings;
  /** Renders the GST/VAT registration line. Mirrors PrintHeaderComponent's showTaxRegistration input. */
  showTaxRegistration?: boolean;
  companyCountryCode?: string;
  companyGstCode?: string;
  companyPan?: string;
  /** Overrides for the derived label/value. Leave unset to let the country code decide. */
  companyTaxLabel?: string;
  companyTaxValue?: string;
}

const DEFAULT_COMPANY_HEADER_SETTINGS: CompanyHeaderPrintSettings = {
  logoPosition: 'left',
  companyPosition: 'center',
  companyAlignment: 'center'
};

const COMPANY_HEADER_LOGO_HEIGHT = 58;

function firstNonEmpty(...values: any[]): string {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function resolveCompanyCountryCode(data: CompanyHeaderData): string {
  const company = data.company as any;
  const branch = data.branch as any;
  return firstNonEmpty(
    data.companyCountryCode,
    branch?.countryMaster?.countryCode,
    branch?.countryCode,
    company?.countryMaster?.countryCode,
    company?.countryCode
  ).toLowerCase();
}

/**
 * Resolve the company's tax registration line the same way PrintHeaderComponent does:
 * India shows the GST registration, everywhere else shows the VAT/PAN registration.
 */
function resolveTaxRegistration(data: CompanyHeaderData): { label: string; value: string } {
  const company = data.company as any;
  const branch = data.branch as any;
  const isIndia = resolveCompanyCountryCode(data) === 'in';

  const gstNo = firstNonEmpty(data.companyGstCode, branch?.taxRegistrationNo, company?.GST_VAT);
  const panNo = firstNonEmpty(data.companyPan, company?.Pan, company?.PAN);

  return {
    label: firstNonEmpty(data.companyTaxLabel) || (isIndia ? 'GST No' : 'VAT No'),
    value: firstNonEmpty(data.companyTaxValue) || (isIndia ? gstNo || panNo : panNo || gstNo)
  };
}

function buildPdfLogoColumn(logo: string | null | undefined, width: number, height: number): any {
  if (!logo || logo === 'none') {
    return { text: '', width };
  }

  const fit: [number, number] = [width, height];

  if (logo.startsWith('data:image/svg+xml')) {
    const svgPayload = logo.split(',')[1] || '';
    const isBase64 = logo.includes(';base64,');
    const svg = isBase64 ? atob(svgPayload) : decodeURIComponent(svgPayload);
    return { svg, fit, alignment: 'left' as const };
  }

  return { image: logo, fit, alignment: 'left' as const };
}

function buildCompanyHeaderLogo(
  logo: string | null | undefined,
  alignment: HeaderPosition
): any | null {
  if (!logo || logo === 'none') {
    return null;
  }

  if (logo.startsWith('data:image/svg+xml')) {
    const svgPayload = logo.split(',')[1] || '';
    const isBase64 = logo.includes(';base64,');
    const svg = isBase64 ? atob(svgPayload) : decodeURIComponent(svgPayload);
    return { svg, height: COMPANY_HEADER_LOGO_HEIGHT, alignment };
  }

  return { image: logo, height: COMPANY_HEADER_LOGO_HEIGHT, alignment };
}

function getCompanyHeaderWidths(
  logoPosition: HeaderPosition,
  companyPosition: HeaderPosition
): any[] {
  if (companyPosition === 'right' && logoPosition === 'left') {
    return [110, '*', 320];
  }

  if (companyPosition === 'left' && logoPosition === 'right') {
    return [320, '*', 110];
  }

  if (companyPosition === 'center' && logoPosition !== 'center') {
    return [110, '*', 110];
  }

  return ['33%', '34%', '33%'];
}

/**
 * Build the common makePDF company header with fixed logo sizing.
 */
export function buildCompanyHeader(data: CompanyHeaderData): any {
  const company = data.company;
  const branch = data.branch;
  const logo = data.logo;
  const printSettings = {
    ...DEFAULT_COMPANY_HEADER_SETTINGS,
    ...(data.printSettings || {})
  };

  const city = branch?.cityMaster?.cityName || branch?.cityName || company?.city || '';
  const postalCode = branch?.postalCode || company?.postalCode || '';
  const phone = branch?.phoneNumber || company?.phoneNumber || '';
  const taxRegistration = resolveTaxRegistration(data);
  const showTaxRegistration = data.showTaxRegistration === true && !!taxRegistration.value;
  const cityLine: any[] = [];
  const appendText = (text: string | any[]) => {
    if (cityLine.length) cityLine.push({ text: ', ' });
    if (Array.isArray(text)) {
      cityLine.push(...text);
    } else {
      cityLine.push({ text });
    }
  };
  const addressLine2 = branch?.addressLine2 || company?.addressLine2;

  if (addressLine2) appendText(addressLine2);
  if (city) appendText(city);
  if (postalCode) appendText([{ text: 'Postal Code : ', bold: true }, { text: postalCode }]);
  if (phone) appendText([{ text: 'Ph.no : ', bold: true }, { text: phone }]);

  const companyInfoStack: any[] = [
    { text: (company?.companyName || '').toUpperCase(), fontSize: 14, bold: true, alignment: printSettings.companyAlignment },
    { text: branch?.branchName || '', fontSize: 11, bold: true, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: branch?.addressLine1 || company?.addressLine1 || '', fontSize: 9, alignment: printSettings.companyAlignment, margin: [0, 1, 0, 0] },
    { text: cityLine, fontSize: 9, alignment: printSettings.companyAlignment, margin: [0, 2, 0, showTaxRegistration ? 1 : 4], noWrap: true },
    ...(showTaxRegistration
      ? [{
          text: [
            { text: `${taxRegistration.label} : `, bold: true },
            { text: taxRegistration.value }
          ],
          fontSize: 9,
          alignment: printSettings.companyAlignment,
          margin: [0, 0, 0, 4],
          noWrap: true
        }]
      : [])
  ];

  const slotAlign: Record<HeaderPosition, HeaderPosition> = {
    left: 'left',
    center: 'center',
    right: 'right'
  };

  const buildSlot = (slot: HeaderPosition) => {
    const stack: any[] = [];
    if (printSettings.logoPosition === slot) {
      const logoNode = buildCompanyHeaderLogo(logo, slotAlign[slot]);
      if (logoNode) {
        stack.push({ ...logoNode, margin: [8, 0, 15, 0] });
      }
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
    table: {
      widths: getCompanyHeaderWidths(printSettings.logoPosition, printSettings.companyPosition),
      body: [[buildSlot('left'), buildSlot('center'), buildSlot('right')]]
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 8
    },
    margin: [0, 5, 0, 5]
  };
}

/**
 * Build company header for PDF document
 */
export function buildHeader(
  company: PdfCompanyInfo,
  branch: PdfBranchInfo,
  logo?: string,
  options: HeaderOptions = {}
): any {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const content: any[] = [];

  // Build logo column
  const logoColumn = opts.showLogo
    ? buildPdfLogoColumn(logo, opts.logoWidth, opts.logoHeight)
    : { text: '', width: opts.logoWidth };

  // Build company info stack
  const companyInfoStack: any[] = [];

  // Company name
  if (company?.companyName) {
    companyInfoStack.push({
      text: company.companyName,
      style: 'companyName',
      alignment: opts.alignment,
      margin: [0, 0, 0, 6]
    });
  }

  // Branch name
  if (opts.showBranch && branch?.branchName) {
    companyInfoStack.push({
      text: branch.branchName,
      style: 'branchName',
      alignment: opts.alignment,
      margin: [0, 2, 0, 2]
    });
  }

  // Address
  if (opts.showAddress) {
    const addressLine1 = branch?.addressLine1 || company?.addressLine1;
    if (addressLine1) {
      companyInfoStack.push({
        text: addressLine1,
        style: 'addressText',
        alignment: opts.alignment,
        margin: [0, 0, 0, 2]
      });
    }

    // City, postal code, phone
    const cityName = branch?.cityMaster?.cityName || branch?.cityName || company?.city;
    const postalCode = branch?.postalCode || company?.postalCode;
    const phone = opts.showPhone ? (branch?.phoneNumber || company?.phoneNumber) : null;

    const addressParts = opts.showPostalPhoneLabels
      ? joinNonEmpty([
          branch?.addressLine2 || company?.addressLine2,
          cityName,
          postalCode ? `Postal Code : ${postalCode}` : ''
        ])
      : joinNonEmpty([
          branch?.addressLine2 || company?.addressLine2,
          cityName,
          postalCode
        ]);

    if (addressParts) {
      companyInfoStack.push({
        text: phone ? `${addressParts}${opts.showPostalPhoneLabels ? ' , Ph.no : ' : ' - '}${phone}` : addressParts,
        style: 'addressText',
        alignment: opts.alignment,
        margin: [0, 0, 0, 2]
      });
    } else if (phone) {
      companyInfoStack.push({
        text: opts.showPostalPhoneLabels ? `Ph.no : ${phone}` : phone,
        style: 'addressText',
        alignment: opts.alignment,
        margin: [0, 0, 0, 2]
      });
    }
  }

  // Build header columns
  const headerColumns: any = {
    columns: [
      logoColumn,
      {
        stack: companyInfoStack,
        width: '*'
      },
      { text: '', width: opts.logoWidth } // Spacer for balance when logo is present
    ],
    margin: opts.compact ? [0, 0, 0, 5] : [0, 0, 0, 10]
  };

  content.push(headerColumns);

  return { stack: content };
}

/**
 * Build a simple header with only company name (no logo)
 */
export function buildSimpleHeader(
  company: PdfCompanyInfo,
  branch?: PdfBranchInfo
): any {
  const stack: any[] = [];

  if (company?.companyName) {
    stack.push({
      text: company.companyName,
      style: 'companyName',
      alignment: 'center'
    });
  }

  if (branch?.branchName) {
    stack.push({
      text: branch.branchName,
      style: 'branchName',
      alignment: 'center'
    });
  }

  return {
    stack,
    margin: [0, 0, 0, 10]
  };
}

/**
 * Build left-aligned header (logo on left, info on right)
 */
export function buildLeftAlignedHeader(
  company: PdfCompanyInfo,
  branch: PdfBranchInfo,
  logo?: string,
  options: HeaderOptions = {}
): any {
  const opts = { ...DEFAULT_OPTIONS, ...options, alignment: 'left' as const };

  const logoColumn = opts.showLogo && logo
    ? {
        image: logo,
        width: opts.logoWidth,
        height: opts.logoHeight
      }
    : { text: '', width: 0 };

  const companyInfoStack: any[] = [];

  if (company?.companyName) {
    companyInfoStack.push({
      text: company.companyName,
      style: 'companyName'
    });
  }

  if (opts.showBranch && branch?.branchName) {
    companyInfoStack.push({
      text: branch.branchName,
      style: 'branchName'
    });
  }

  if (opts.showAddress) {
    const addressLine1 = branch?.addressLine1 || company?.addressLine1;
    if (addressLine1) {
      companyInfoStack.push({
        text: addressLine1,
        style: 'addressText'
      });
    }

    const cityName = branch?.cityMaster?.cityName || branch?.cityName || company?.city;
    const postalCode = branch?.postalCode || company?.postalCode;
    const addressLine2 = joinNonEmpty([branch?.addressLine2, cityName, postalCode]);

    if (addressLine2) {
      companyInfoStack.push({
        text: addressLine2,
        style: 'addressText'
      });
    }

    if (opts.showPhone) {
      const phone = branch?.phoneNumber || company?.phoneNumber;
      if (phone) {
        companyInfoStack.push({
          text: `Tel: ${phone}`,
          style: 'addressText'
        });
      }
    }
  }

  return {
    columns: [
      logoColumn,
      {
        stack: companyInfoStack,
        margin: [10, 0, 0, 0]
      }
    ],
    margin: [0, 0, 0, 10]
  };
}

/**
 * Build header with document info on the right side
 */
export function buildHeaderWithDocInfo(
  company: PdfCompanyInfo,
  branch: PdfBranchInfo,
  logo: string | undefined,
  docInfo: { label: string; value: string }[]
): any {
  const logoColumn = logo
    ? {
        image: logo,
        width: 60,
        height: 60
      }
    : { text: '', width: 60 };

  const companyStack: any[] = [];

  if (company?.companyName) {
    companyStack.push({
      text: company.companyName,
      style: 'companyName',
      alignment: 'center'
    });
  }

  if (branch?.branchName) {
    companyStack.push({
      text: branch.branchName,
      style: 'branchName',
      alignment: 'center'
    });
  }

  const docInfoStack = docInfo.map(item => ({
    columns: [
      { text: item.label, style: 'labelBold', width: 100 },
      { text: `: ${item.value}`, width: '*' }
    ]
  }));

  return {
    columns: [
      logoColumn,
      {
        stack: companyStack,
        width: '*'
      },
      {
        stack: docInfoStack,
        width: 180
      }
    ],
    margin: [0, 0, 0, 10]
  };
}
