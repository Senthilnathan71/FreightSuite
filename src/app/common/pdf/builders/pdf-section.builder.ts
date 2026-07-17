/**
 * PDF Section Builder
 * Builds title, customer info, terms, greeting, and signature sections
 */

import { PdfTermItem, PdfUserInfo, PdfCompanyInfo } from '../interfaces/pdf-base.interface';
import { formatDate } from '../helpers/pdf-formatters';

/**
 * Build document title with horizontal line
 */
export function buildTitle(
  title: string,
  options: {
    subtitle?: string;
    alignment?: 'left' | 'center' | 'right';
    showLine?: boolean;
    lineWidth?: number;
    lineThickness?: number;
    margin?: [number, number, number, number];
    linePadding?: number; // 👈 new option,
    fontSize?:number;
  } = {}
): any {

  const {
    subtitle,
    alignment = 'center',
    showLine = true,
    lineWidth = 575,
    lineThickness = 1,
    margin = [0, 0, 0, 10],
    linePadding = 12,  // 👈 default left/right spacing
    fontSize=7
  } = options;

  const stack: any[] = [];

  const adjustedWidth = lineWidth - (linePadding * 2);

  // Top line
  if (showLine) {
    stack.push({
      canvas: [
        {
          type: 'line',
          x1: linePadding,
          y1: 0,
          x2: linePadding + adjustedWidth,
          y2: 0,
          lineWidth: lineThickness
        }
      ],
      margin: [0, 0, 0, 0]
    });
  }

  // Title
  stack.push({
    text: title,
    style: 'documentTitle',
    alignment,
    margin: [0, 8, 0, subtitle ? 4 : 8]
  });

  // Subtitle
  if (subtitle) {
    stack.push({
      text: subtitle,
      style: 'sectionTitle',
      alignment,
      margin: [0, 0, 0, 8]
    });
  }

  // Bottom line
  if (showLine) {
    stack.push({
      canvas: [
        {
          type: 'line',
          x1: linePadding,
          y1: 0,
          x2: linePadding + adjustedWidth,
          y2: 0,
          lineWidth: lineThickness
        }
      ],
      margin: [0, 0, 0, 0]
    });
  }

  return { stack, margin };
}


/**
 * Build section title
 */
export function buildSectionTitle(
  title: string,
  options: {
    style?: string;
    margin?: [number, number, number, number];
    showUnderline?: boolean;
    lineWidth?: number;
    linePadding?: number; // 👈 new option
  } = {}
): any {
  const {
    style = 'sectionTitle',
    margin = [0, 0, 0, 10],
    showUnderline = false,
    
  } = options;

  const stack: any[] = [
    {
      text: title,
      style,
      margin: showUnderline ? [0, 0, 0, 2] : undefined
    }
  ];

  if (showUnderline) {
    stack.push({
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 100, y2: 0, lineWidth: 1 }]
    });
  }

  return { stack, margin };
}

/**
 * Build customer info section (two-column layout)
 */
export function buildCustomerInfo(
  customerInfo: {
    customerName?: string;
    customerAddress?: string;
    contactPerson?: string;
    contactNumber?: string;
    email?: string;
  },
  documentInfo: {
    docNumber?: string;
    docDate?: Date | string;
    reference?: string;
    additionalFields?: { label: string; value: string }[];
  },
  options: {
    docTypeLabel?: string;
    margin?: [number, number, number, number];
  } = {}
): any {
  const {
    docTypeLabel = 'Document',
    margin = [0, 0, 0, 15]
  } = options;

  // Left side - Customer info
  const customerStack: any[] = [
    { text: 'To', style: 'labelBold' }
  ];

  if (customerInfo.customerName) {
    customerStack.push({
      text: customerInfo.customerName,
      style: 'customerText',
      margin: [15, 0, 0, 0]
    });
  }

  if (customerInfo.customerAddress) {
    customerStack.push({
      text: customerInfo.customerAddress,
      style: 'customerText',
      margin: [15, 0, 0, 0]
    });
  }

  if (customerInfo.contactPerson) {
    customerStack.push({
      text: `Attn: ${customerInfo.contactPerson}`,
      style: 'customerText',
      margin: [15, 5, 0, 0]
    });
  }

  if (customerInfo.contactNumber) {
    customerStack.push({
      text: `Tel: ${customerInfo.contactNumber}`,
      style: 'customerText',
      margin: [15, 0, 0, 0]
    });
  }

  if (customerInfo.email) {
    customerStack.push({
      text: `Email: ${customerInfo.email}`,
      style: 'customerText',
      margin: [15, 0, 0, 0]
    });
  }

  // Right side - Document details
  const docStack: any[] = [];

  if (documentInfo.docNumber) {
    docStack.push({
      columns: [
        { text: `${docTypeLabel} No.`, style: 'labelBold', width: 90 },
        { text: `: ${documentInfo.docNumber}`, width: '*' }
      ]
    });
  }

  if (documentInfo.docDate) {
    docStack.push({
      columns: [
        { text: `${docTypeLabel} Date`, style: 'labelBold', width: 90 },
        { text: `: ${formatDate(documentInfo.docDate)}`, width: '*' }
      ]
    });
  }

  if (documentInfo.reference) {
    docStack.push({
      columns: [
        { text: 'Reference', style: 'labelBold', width: 90 },
        { text: `: ${documentInfo.reference}`, width: '*' }
      ]
    });
  }

  // Additional fields
  if (documentInfo.additionalFields) {
    documentInfo.additionalFields.forEach(field => {
      docStack.push({
        columns: [
          { text: field.label, style: 'labelBold', width: 90 },
          { text: `: ${field.value}`, width: '*' }
        ]
      });
    });
  }

  return {
    columns: [
      { stack: customerStack, width: '50%' },
      { stack: docStack, width: '50%', alignment: 'right' }
    ],
    margin
  };
}

/**
 * Build party info block (shipper, consignee, notify)
 */
export function buildPartyInfo(
  label: string,
  party: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
  },
  options: {
    width?: string | number;
    margin?: [number, number, number, number];
    showBorder?: boolean;
  } = {}
): any {
  const {
    width = '*',
    margin = [0, 0, 0, 10],
    showBorder = false
  } = options;

  const stack: any[] = [
    { text: label, style: 'labelBold', margin: [0, 0, 0, 3] }
  ];

  if (party.name) {
    stack.push({ text: party.name, style: 'customerName' });
  }

  if (party.address) {
    stack.push({ text: party.address, style: 'customerText' });
  }

  const cityCountry = [party.city, party.country].filter(Boolean).join(', ');
  if (cityCountry) {
    stack.push({ text: cityCountry, style: 'customerText' });
  }

  if (party.phone) {
    stack.push({ text: `Tel: ${party.phone}`, style: 'customerText' });
  }

  if (party.email) {
    stack.push({ text: `Email: ${party.email}`, style: 'customerText' });
  }

  if (showBorder) {
    return {
      table: {
        widths: ['*'],
        body: [[{ stack, margin: [5, 5, 5, 5] }]]
      },
      layout: 'bordered',
      width,
      margin
    };
  }

  return { stack, width, margin };
}

/**
 * Build greeting section
 */
export function buildGreeting(
  greeting: string = 'Dear Sir/Mam,',
  message?: string,
  options: { margin?: [number, number, number, number] } = {}
): any {
  const { margin = [0, 0, 0, 15] } = options;

  const stack: any[] = [
    { text: greeting, style: 'labelBold', margin: [0, 0, 0, 5] }
  ];

  if (message) {
    stack.push({ text: message });
  }

  return { stack, margin };
}

/**
 * Build terms and conditions section
 */
export function buildTermsSection(
  terms: (PdfTermItem | string)[],
  options: {
    title?: string;
    numbered?: boolean;
    margin?: [number, number, number, number];
    showTitleWhenEmpty?: boolean;
  } = {}
): any {
  const {
    title = 'Terms and Conditions',
    numbered = false,
    margin = [0, 0, 0, 15],
    showTitleWhenEmpty = false
  } = options;

  if (!terms || terms.length === 0) {
    if (showTitleWhenEmpty) {
      return {
        stack: [
          { text: title, style: 'sectionTitle', margin: [0, 10, 0, 5] }
        ],
        margin
      };
    }

    return { text: '' };
  }

  const termsList = terms.map((term, index) => {
    const content = typeof term === 'string' ? term : term.content;
    return {
      text: numbered ? `${index + 1}. ${content}` : content,
      margin: [0, 2, 0, 2]
    };
  });

  return {
    stack: [
      { text: title, style: 'sectionTitle', margin: [0, 10, 0, 5] },
      numbered
        ? { ol: termsList.map(t => t.text) }
        : { ul: termsList.map(t => t.text) }
    ],
    margin
  };
}

/**
 * Build closing message section
 */
export function buildClosingMessage(
  message: string = 'We kindly look forward to your valuable support regarding the above shipment.',
  options: { margin?: [number, number, number, number] } = {}
): any {
  const { margin = [0, 10, 0, 15] } = options;

  return {
    text: message,
    style: 'labelBold',
    margin
  };
}

/**
 * Build signature section
 */
export function buildSignature(
  userData: PdfUserInfo,
  company?: PdfCompanyInfo,
  options: {
    showRegards?: boolean;
    regardsText?: string;
    margin?: [number, number, number, number];
  } = {}
): any {
  const {
    showRegards = true,
    regardsText = 'Best Regards',
    margin = [0, 0, 0, 0]
  } = options;

  const stack: any[] = [];

  if (showRegards) {
    stack.push({
      text: regardsText,
      style: 'labelBold',
      margin: [0, 0, 0, 8]
    });
  }

  stack.push({
    columns: [
      { text: 'Name', style: 'labelBold', width: 60 },
      { text: `: ${userData?.userName || ''}`, width: '*' }
    ]
  });

  if (company?.companyName) {
    stack.push({
      columns: [
        { text: 'Company', style: 'labelBold', width: 60 },
        { text: `: ${company.companyName}`, width: '*' }
      ]
    });
  }

  if (userData?.email) {
    stack.push({
      columns: [
        { text: 'Email', style: 'labelBold', width: 60 },
        { text: `: ${userData.email}`, width: '*' }
      ]
    });
  }

  return { stack, margin };
}

/**
 * Build horizontal divider line
 */
export function buildDivider(
  options: {
    width?: number;
    color?: string;
    thickness?: number;
    margin?: [number, number, number, number];
  } = {}
): any {
  const {
    width = 515,
    color = '#000000',
    thickness = 1,
    margin = [0, 10, 0, 10]
  } = options;

  return {
    canvas: [{
      type: 'line',
      x1: 0,
      y1: 0,
      x2: width,
      y2: 0,
      lineWidth: thickness,
      lineColor: color
    }],
    margin
  };
}

/**
 * Build route header (department + route info)
 */
export function buildRouteHeader(
  departmentName: string,
  routeLabel: string,
  options: {
    margin?: [number, number, number, number];
    fillColor?: string;
  } = {}
): any {
  const {
    margin = [0, 0, 0, 0],
    fillColor = '#f5f5f5'
  } = options;

  return {
    table: {
      widths: ['*'],
      body: [
        [{
          columns: [
            { text: departmentName || '', style: 'routeHeader' },
            { text: routeLabel, style: 'routeHeader', alignment: 'right' }
          ],
          fillColor,
          margin: [5, 5, 5, 5]
        }]
      ]
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 0,
      hLineColor: () => '#000000'
    },
    margin
  };
}

/**
 * Build info row (label: value format)
 */
export function buildInfoRow(
  items: { label: string; value: string; width?: string }[],
  options: { margin?: [number, number, number, number] } = {}
): any {
  const { margin = [0, 8, 0, 8] } = options;

  const columns = items.map(item => ({
    text: [
      { text: `${item.label} : `, bold: true },
      item.value || ''
    ],
    width: item.width || '*'
  }));

  return { columns, margin };
}

/**
 * Build remarks section
 */
export function buildRemarks(
  remarks: string,
  options: {
    title?: string;
    margin?: [number, number, number, number];
    labelWidth?: number;
    fontSize?:number;
  } = {}
): any {
  const {
    title = 'Remarks',
    margin = [0, 10, 0, 10],
    labelWidth = 120,
    fontSize=7
  } = options;

  return {
    stack: [
      {
        columns: [
          { text: title, style: 'labelBold', width: labelWidth , fontSize},
          { text: ':', width: 6, alignment: 'right' },
          { text: remarks || '', width: '*', style: '' , fontSize}
        ],
        margin: [0, 0, 0, 3]
      }
    ],
    margin
  };
}

/**
 * Build confirmation message
 */
export function buildConfirmationMessage(
  message: string = 'We are pleased to confirm your booking as below :',
  options: { margin?: [number, number, number, number] } = {}
): any {
  const { margin = [0, 0, 0, 10] } = options;

  return {
    text: message,
    style: 'labelBold',
    margin
  };
}
