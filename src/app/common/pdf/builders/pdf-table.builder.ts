/**
 * PDF Table Builder
 * Builds charges, cargo, and container tables
 */

import { PdfTableColumn, PdfChargeItem, PdfCargoItem, PdfContainerItem } from '../interfaces/pdf-base.interface';
import { formatNumber, formatNumberWithCommas, formatDate } from '../helpers/pdf-formatters';
import { PDF_TABLE_LAYOUTS } from '../styles/pdf-styles';

export interface TableOptions {
  layout?: keyof typeof PDF_TABLE_LAYOUTS | any;
  headerStyle?: string;
  cellStyle?: string;
  margin?: [number, number, number, number];
  showTotals?: boolean;
  totalLabel?: string;
  alternateRowColors?: boolean;
  alternateColor?: string;
}

const DEFAULT_TABLE_OPTIONS: TableOptions = {
  layout: 'bordered',
  headerStyle: 'tableHeader',
  cellStyle: 'tableCell',
  margin: [0, 0, 0, 15],
  showTotals: false,
  totalLabel: 'Total',
  alternateRowColors: false,
  alternateColor: '#f9f9f9'
};

/**
 * Build a generic table from data array and column definitions
 */
export function buildTable(
  data: any[],
  columns: PdfTableColumn[],
  options: TableOptions = {}
): any {
  const opts = { ...DEFAULT_TABLE_OPTIONS, ...options };

  if (!data || data.length === 0) {
    return { text: '' };
  }

  // Build header row
  const headerRow = columns.map(col => ({
    text: col.header,
    style: opts.headerStyle,
    alignment: col.alignment || 'left'
  }));

  // Build data rows
  const dataRows = data.map((row, rowIndex) => {
    return columns.map(col => {
      let value = row[col.field];
      let displayValue = '';

      // Format based on column type
      switch (col.format) {
        case 'number':
          displayValue = formatNumber(value, col.decimals || 0);
          break;
        case 'currency':
          displayValue = formatNumberWithCommas(value, col.decimals || 2);
          break;
        case 'date':
          displayValue = formatDate(value);
          break;
        default:
          displayValue = value !== null && value !== undefined ? String(value) : '';
      }

      const cell: any = {
        text: displayValue,
        style: opts.cellStyle,
        alignment: col.alignment || 'left'
      };

      // Add alternate row coloring
      if (opts.alternateRowColors && rowIndex % 2 === 1) {
        cell.fillColor = opts.alternateColor;
      }

      return cell;
    });
  });

  // Calculate widths
  const widths = columns.map(col => col.width || '*');

  // Get layout
  const layout = typeof opts.layout === 'string'
    ? PDF_TABLE_LAYOUTS[opts.layout] || PDF_TABLE_LAYOUTS.bordered
    : opts.layout;

  return {
    table: {
      headerRows: 1,
      widths,
      body: [headerRow, ...dataRows]
    },
    layout,
    margin: opts.margin
  };
}

/**
 * Build charges table for quotation/booking
 */
export function buildChargesTable(
  charges: any[],
  showAgreedRate: boolean = false,
  lookups: {
    currencyMaster?: any[];
    chargeUnitMaster?: any[];
  } = {},
  options: TableOptions = {}
): any {
  const opts = { ...DEFAULT_TABLE_OPTIONS, ...options };

  if (!charges || charges.length === 0) {
    return { text: '' };
  }

  // Build header row
  const headerRow: any[] = [
    { text: 'Charge', style: opts.headerStyle },
    { text: 'Unit', style: opts.headerStyle },
    { text: 'Qty', style: opts.headerStyle, alignment: 'right' },
    { text: 'Curr', style: opts.headerStyle }
  ];

  if (showAgreedRate) {
    headerRow.push({ text: 'Ex Rate', style: opts.headerStyle, alignment: 'right' });
  }

  headerRow.push(
    { text: 'Rate', style: opts.headerStyle, alignment: 'right' },
    { text: 'Amount', style: opts.headerStyle, alignment: 'right' }
  );

  if (showAgreedRate) {
    headerRow.push({ text: 'Local Amt', style: opts.headerStyle, alignment: 'right' });
  }

  // Helper functions for lookups
  const getUOMCode = (uomId: number): string => {
    if (!uomId || !lookups.chargeUnitMaster) return '';
    const uom = lookups.chargeUnitMaster.find(u => u.UOMMasterSid === uomId);
    return uom?.UOMCode || '';
  };

  const getCurrencyCode = (currencyId: number): string => {
    if (!currencyId || !lookups.currencyMaster) return '';
    const currency = lookups.currencyMaster.find(c => c.CurrencyMasterSid === currencyId);
    return currency?.currencyCode || '';
  };

  // Build data rows
  const dataRows = charges.map(charge => {
    const row: any[] = [
      { text: charge.ChargeDisplayName || charge.chargeName || '', style: opts.cellStyle },
      { text: getUOMCode(charge.RevenueChargeUomSid) || charge.unit || '', style: opts.cellStyle },
      { text: formatNumber(charge.Qty || charge.qty, 0), style: opts.cellStyle, alignment: 'right' },
      { text: getCurrencyCode(charge.RevenueCurrencyMasterSid) || charge.currency || '', style: opts.cellStyle }
    ];

    if (showAgreedRate) {
      row.push({
        text: formatNumber(charge.RevenueExchangeRate || charge.exchangeRate, 3),
        style: opts.cellStyle,
        alignment: 'right'
      });
    }

    row.push(
      { text: formatNumber(charge.RevenueRate || charge.rate, 3), style: opts.cellStyle, alignment: 'right' },
      { text: formatNumber(charge.RevenueAmount || charge.amount, 3), style: opts.cellStyle, alignment: 'right' }
    );

    if (showAgreedRate) {
      row.push({
        text: formatNumber(charge.RevenueLocalAmount || charge.localAmount, 3),
        style: opts.cellStyle,
        alignment: 'right'
      });
    }

    return row;
  });

  // Calculate widths
  const baseWidths = showAgreedRate
    ? ['*', 50, 40, 40, 50, 55, 55, 60]
    : ['*', 60, 50, 50, 65, 70];

  return {
    table: {
      headerRows: 1,
      widths: baseWidths,
      body: [headerRow, ...dataRows]
    },
    layout: PDF_TABLE_LAYOUTS.bordered,
    margin: opts.margin
  };
}

/**
 * Build cargo table for FCL/LCL/AIR shipments
 */
export function buildCargoTable(
  cargo: any[],
  fclLcl: 'FCL' | 'LCL' | 'AIR',
  options: TableOptions = {}
): any {
  const opts = { ...DEFAULT_TABLE_OPTIONS, ...options };

  if (!cargo || cargo.length === 0) {
    return { text: '' };
  }

  // Define columns based on shipment type
  let columns: PdfTableColumn[] = [
    { header: 'Commodity', field: 'CargoType', width: '*' }
  ];

  if (fclLcl === 'FCL') {
    columns.push(
      { header: 'Container Type', field: 'ContainerType', width: 80 },
      { header: 'No. of Containers', field: 'NoofContainers', width: 80, alignment: 'right', format: 'number' }
    );
  }

  columns.push({
    header: 'Gross Weight',
    field: 'GrossWeight',
    width: 70,
    alignment: 'right',
    format: 'number',
    decimals: 2
  });

  if (fclLcl === 'LCL') {
    columns.push({
      header: 'No. of Pkg',
      field: 'NoOfPackage',
      width: 60,
      alignment: 'right',
      format: 'number'
    });
  }

  if (fclLcl === 'AIR') {
    columns.push({
      header: 'Chargeable Wt',
      field: 'ChargeableWeight',
      width: 80,
      alignment: 'right',
      format: 'number',
      decimals: 2
    });
  }

  columns.push({
    header: 'Volume (CBM)',
    field: 'Volume',
    width: 70,
    alignment: 'right',
    format: 'number',
    decimals: 3
  });

  return buildTable(cargo, columns, opts);
}

/**
 * Build container details table
 */
export function buildContainerTable(
  containers: PdfContainerItem[],
  options: TableOptions = {}
): any {
  const opts = { ...DEFAULT_TABLE_OPTIONS, ...options };

  if (!containers || containers.length === 0) {
    return { text: '' };
  }

  const columns: PdfTableColumn[] = [
    { header: 'Container No', field: 'containerNo', width: '*' },
    { header: 'Type', field: 'containerType', width: 60 },
    { header: 'Seal No', field: 'sealNo', width: 80 },
    { header: 'Gross Wt', field: 'grossWeight', width: 60, alignment: 'right', format: 'number', decimals: 2 },
    { header: 'Packages', field: 'packageQty', width: 50, alignment: 'right', format: 'number' }
  ];

  return buildTable(containers, columns, opts);
}

/**
 * Build product details table
 */
export function buildProductTable(
  products: any[],
  options: TableOptions = {}
): any {
  const opts = { ...DEFAULT_TABLE_OPTIONS, ...options };

  if (!products || products.length === 0) {
    return { text: '' };
  }

  const columns: PdfTableColumn[] = [
    { header: 'Product', field: 'ProductName', width: '*' },
    { header: 'HS Code', field: 'HSCode', width: 70 },
    { header: 'Gross Wt', field: 'GrossWeight', width: 60, alignment: 'right', format: 'number', decimals: 2 },
    { header: 'Net Wt', field: 'NetWeight', width: 60, alignment: 'right', format: 'number', decimals: 2 },
    { header: 'Volume', field: 'Volume', width: 60, alignment: 'right', format: 'number', decimals: 3 }
  ];

  return buildTable(products, columns, opts);
}

/**
 * Build simple key-value table (two columns)
 */
export function buildKeyValueTable(
  items: { key: string; value: string }[],
  options: {
    keyWidth?: number | string;
    valueWidth?: number | string;
    margin?: [number, number, number, number];
  } = {}
): any {
  const { keyWidth = 120, valueWidth = '*', margin = [0, 0, 0, 10] } = options;

  if (!items || items.length === 0) {
    return { text: '' };
  }

  const body = items.map(item => [
    { text: item.key, style: 'labelBold', width: keyWidth },
    { text: `: ${item.value}`, width: valueWidth }
  ]);

  return {
    table: {
      widths: [keyWidth, valueWidth],
      body
    },
    layout: PDF_TABLE_LAYOUTS.noBorders,
    margin
  };
}

/**
 * Build two-column layout table for document info
 */
export function buildTwoColumnInfo(
  leftItems: { label: string; value: string }[],
  rightItems: { label: string; value: string }[],
  options: {
    labelWidth?: number;
    margin?: [number, number, number, number];
  } = {}
): any {
  const { labelWidth = 100, margin = [0, 0, 0, 15] } = options;

  const buildColumn = (items: { label: string; value: string }[]) => {
    return items.map(item => ({
      columns: [
        { text: item.label, style: 'labelBold', width: labelWidth },
        { text: `: ${item.value}`, width: '*' }
      ]
    }));
  };

  return {
    columns: [
      { stack: buildColumn(leftItems), width: '50%' },
      { stack: buildColumn(rightItems), width: '50%' }
    ],
    margin
  };
}

/**
 * Build house jobs summary table for manifest
 */
export function buildHouseJobsTable(
  houseJobs: any[],
  options: TableOptions = {}
): any {
  const opts = { ...DEFAULT_TABLE_OPTIONS, ...options };

  if (!houseJobs || houseJobs.length === 0) {
    return { text: '' };
  }

  const columns: PdfTableColumn[] = [
    { header: 'HBL No', field: 'hblNo', width: 80 },
    { header: 'Shipper', field: 'shipperName', width: '*' },
    { header: 'Consignee', field: 'consigneeName', width: '*' },
    { header: 'Pkgs', field: 'packages', width: 40, alignment: 'right', format: 'number' },
    { header: 'Gross Wt', field: 'grossWeight', width: 55, alignment: 'right', format: 'number', decimals: 2 },
    { header: 'CBM', field: 'volume', width: 45, alignment: 'right', format: 'number', decimals: 3 }
  ];

  return buildTable(houseJobs, columns, opts);
}

/**
 * Build totals row for a table
 */
export function buildTotalsRow(
  totals: { label: string; value: number | string; format?: 'number' | 'currency' }[],
  colSpan: number = 1,
  options: { style?: string; alignment?: 'left' | 'center' | 'right' } = {}
): any[] {
  const { style = 'tableFooter', alignment = 'right' } = options;

  const row: any[] = [];

  if (colSpan > 1) {
    row.push({
      text: 'Total',
      style,
      colSpan,
      alignment: 'right'
    });
    for (let i = 1; i < colSpan; i++) {
      row.push({});
    }
  }

  totals.forEach(total => {
    const displayValue = typeof total.value === 'number'
      ? (total.format === 'currency' ? formatNumberWithCommas(total.value, 2) : formatNumber(total.value, 2))
      : total.value;

    row.push({
      text: displayValue,
      style,
      alignment
    });
  });

  return row;
}
