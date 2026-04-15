/**
 * PDF Footer Builder
 * Builds page footer with Printed By, disclaimer, Printed On, and page numbers
 */

import { PdfUserInfo } from '../interfaces/pdf-base.interface';
import { formatDate, formatDateTime } from '../helpers/pdf-formatters';

export interface FooterOptions {
  showPrintedBy?: boolean;
  showPrintedOn?: boolean;
  showPageNumbers?: boolean;
  showDisclaimer?: boolean;
  disclaimerText?: string;
  pageMargins?: [number, number, number, number];
}

const DEFAULT_FOOTER_OPTIONS: FooterOptions = {
  showPrintedBy: true,
  showPrintedOn: true,
  showPageNumbers: false,
  showDisclaimer: true,
  disclaimerText: 'This document is computer-generated and does not require a signature.',
  pageMargins: [30, 0, 30, 5]
};

/**
 * Build standard footer with Printed By, disclaimer, Printed On
 */


export function buildFooter(
  userData: PdfUserInfo,
  currentPage?: number,
  pageCount?: number,
  options: FooterOptions = {}
): any {
  const opts = { ...DEFAULT_FOOTER_OPTIONS, ...options };
  const columns: any[] = [];
  const rightParts: string[] = [];

  if (opts.showPrintedOn) {
    rightParts.push(`Printed On : ${formatDate(new Date())}`);
  }

  if (opts.showPageNumbers && currentPage !== undefined && pageCount !== undefined) {
    rightParts.push(`Page ${currentPage} of ${pageCount}`);
  }

  if (opts.showPrintedBy) {
    columns.push({
      text: `Printed By : ${userData?.userName || ''}`,
      fontSize: 7,
      alignment: 'left',
      width: opts.showDisclaimer ? '25%' : '50%'
    });
  }

  if (opts.showDisclaimer) {
    columns.push({
      text: opts.disclaimerText,
      fontSize: 7,
      alignment: 'center',
      width: '*'
    });
  }

  if (rightParts.length) {
    columns.push({
      text: rightParts.join('  '),
      fontSize: 7,
      alignment: 'right',
      width: opts.showDisclaimer ? '25%' : '50%'
    });
  }

  return {
    columns,
    margin: opts.pageMargins
  };
}

/**
 * Build footer function for pdfmake document definition
 * Returns a function that can be used as the footer property
 */
export function createFooterFunction(
  userData: PdfUserInfo,
  options: FooterOptions = {}
): (currentPage: number, pageCount: number) => any {
  return (currentPage: number, pageCount: number) => {
    return buildFooter(userData, currentPage, pageCount, options);
  };
}

/**
 * Build simple footer with just page numbers
 */
export function buildSimpleFooter(
  currentPage: number,
  pageCount: number,
  margins: [number, number, number, number] = [40, 20, 40, 0]
): any {
  return {
    text: `Page ${currentPage} of ${pageCount}`,
    fontSize: 8,
    alignment: 'center',
    margin: margins
  };
}

/**
 * Build footer with company contact info
 */
export function buildContactFooter(
  userData: PdfUserInfo,
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  }
): any {
  const stack: any[] = [];

  // Printed info row
  stack.push({
    columns: [
      {
        text: `Printed By: ${userData?.userName || ''}`,
        fontSize: 8,
        width: '50%'
      },
      {
        text: `Printed On: ${formatDateTime(new Date())}`,
        fontSize: 8,
        alignment: 'right',
        width: '50%'
      }
    ]
  });

  // Contact info row (if provided)
  if (contactInfo) {
    const contactParts: string[] = [];
    if (contactInfo.phone) contactParts.push(`Tel: ${contactInfo.phone}`);
    if (contactInfo.email) contactParts.push(`Email: ${contactInfo.email}`);
    if (contactInfo.website) contactParts.push(contactInfo.website);

    if (contactParts.length > 0) {
      stack.push({
        text: contactParts.join(' | '),
        fontSize: 7,
        alignment: 'center',
        margin: [0, 3, 0, 0]
      });
    }
  }

  // Disclaimer
  stack.push({
    text: 'This document is computer-generated and does not require a signature.',
    fontSize: 7,
    italics: true,
    alignment: 'center',
    margin: [0, 3, 0, 0]
  });

  return {
    stack,
    margin: [40, 10, 40, 0]
  };
}

/**
 * Build footer with custom message
 */
export function buildCustomFooter(
  userData: PdfUserInfo,
  message: string,
  options: FooterOptions = {}
): any {
  const opts = { ...DEFAULT_FOOTER_OPTIONS, ...options };

  return {
    stack: [
      {
        text: message,
        fontSize: 8,
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      {
        columns: [
          {
            text: opts.showPrintedBy ? `Printed By: ${userData?.userName || ''}` : '',
            fontSize: 8,
            width: '50%'
          },
          {
            text: opts.showPrintedOn ? `Printed On: ${formatDate(new Date())}` : '',
            fontSize: 8,
            alignment: 'right',
            width: '50%'
          }
        ]
      }
    ],
    margin: opts.pageMargins
  };
}

/**
 * Build thank you footer (commonly used in quotations/confirmations)
 */
export function buildThankYouFooter(
  userData: PdfUserInfo,
  thankYouMessage: string = 'Thank you for your business!'
): any {
  return {
    stack: [
      {
        text: thankYouMessage,
        fontSize: 10,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      {
        columns: [
          {
            text: `Printed By: ${userData?.userName || ''}`,
            fontSize: 8,
            width: '33%'
          },
          {
            text: 'This document is computer-generated.',
            fontSize: 7,
            alignment: 'center',
            width: '34%'
          },
          {
            text: `Printed On: ${formatDate(new Date())}`,
            fontSize: 8,
            alignment: 'right',
            width: '33%'
          }
        ]
      }
    ],
    margin: [40, 10, 40, 0]
  };
}
