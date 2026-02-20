/**
 * PDF Header Builder
 * Builds company header with logo, company name, branch, and address
 */

import { PdfCompanyInfo, PdfBranchInfo } from '../interfaces/pdf-base.interface';
import { joinNonEmpty } from '../helpers/pdf-formatters';

export interface HeaderOptions {
  showLogo?: boolean;
  logoWidth?: number;
  logoHeight?: number;
  alignment?: 'left' | 'center' | 'right';
  showBranch?: boolean;
  showAddress?: boolean;
  showPhone?: boolean;
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
  compact: false
};

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
  const logoColumn = opts.showLogo && logo
    ? {
        image: logo,
        width: opts.logoWidth,
        height: opts.logoHeight,
        alignment: 'left' as const
      }
    : { text: '', width: opts.logoWidth };

  // Build company info stack
  const companyInfoStack: any[] = [];

  // Company name
  if (company?.companyName) {
    companyInfoStack.push({
      text: company.companyName,
      style: 'companyName',
      alignment: opts.alignment,
      margin: [0, 0, 0, 4]
    });
  }

  // Branch name
  if (opts.showBranch && branch?.branchName) {
    companyInfoStack.push({
      text: branch.branchName,
      style: 'branchName',
      alignment: opts.alignment
    });
  }

  // Address
  if (opts.showAddress) {
    const addressLine1 = branch?.addressLine1 || company?.addressLine1;
    if (addressLine1) {
      companyInfoStack.push({
        text: addressLine1,
        style: 'addressText',
        alignment: opts.alignment
      });
    }

    // City, postal code, phone
    const cityName = branch?.cityMaster?.cityName || branch?.cityName || company?.city;
    const postalCode = branch?.postalCode || company?.postalCode;
    const phone = opts.showPhone ? (branch?.phoneNumber || company?.phoneNumber) : null;

    const addressParts = joinNonEmpty([
      branch?.addressLine2 || company?.addressLine2,
      cityName,
      postalCode
    ]);

    if (addressParts) {
      companyInfoStack.push({
        text: phone ? `${addressParts} - ${phone}` : addressParts,
        style: 'addressText',
        alignment: opts.alignment
      });
    } else if (phone) {
      companyInfoStack.push({
        text: phone,
        style: 'addressText',
        alignment: opts.alignment
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
