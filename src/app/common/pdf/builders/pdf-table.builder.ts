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
  const opts = { ...DEFAULT_TABLE_OPTIONS, layout: 'bordered', ...options };

  if (!cargo || cargo.length === 0) {
    return { text: '' };
  }

  // Define columns based on shipment type
  let columns: PdfTableColumn[] = [];

  if (fclLcl === 'AIR') {
    columns = [
      { header: 'Cargo Type', field: 'CargoType', width: 58 },
      { header: 'Cargo Desc', field: 'CargoDesc', width: '*' },
      { header: 'Product Name', field: 'ProductName', width: 62 },
      { header: 'Chargeable Wt.', field: 'ChargeableWeight', width: 70, alignment: 'right', format: 'number', decimals: 3 },
      { header: 'Pkg Type', field: 'PackageType', width: 42 },
      { header: 'Qty.', field: 'Qty', width: 30, alignment: 'right', format: 'number', decimals: 2 },
      { header: 'Gross Wt.', field: 'GrossWeight', width: 46, alignment: 'right', format: 'number', decimals: 3 },
      { header: 'CBM', field: 'Volume', width: 44, alignment: 'right', format: 'number', decimals: 3 }
    ];

    const headerRow = columns.map(col => ({
      text: col.header,
      style: opts.headerStyle,
      alignment: 'center',
      noWrap: true
    }));

    const dataRows = cargo.map((row, rowIndex) => {
      return columns.map(col => {
        let value = row[col.field];
        let displayValue = '';

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

        if (opts.alternateRowColors && rowIndex % 2 === 1) {
          cell.fillColor = opts.alternateColor;
        }

        return cell;
      });
    });

    const totalQty = cargo.reduce((sum, item) => sum + (Number(item.Qty) || 0), 0);
    const totalGrossWeight = cargo.reduce((sum, item) => sum + (Number(item.GrossWeight) || 0), 0);
    const totalVolume = cargo.reduce((sum, item) => sum + (Number(item.Volume) || 0), 0);

    const totalRow: any[] = columns.map(() => ({ text: '', style: opts.cellStyle }));
    totalRow[4] = { text: 'Total', style: opts.cellStyle, alignment: 'right' };
    totalRow[5] = { text: formatNumber(totalQty, 2), style: opts.cellStyle, alignment: 'right' };
    totalRow[6] = { text: formatNumber(totalGrossWeight, 3), style: opts.cellStyle, alignment: 'right' };
    totalRow[7] = { text: formatNumber(totalVolume, 3), style: opts.cellStyle, alignment: 'right' };

    const widths = columns.map(col => col.width || '*');
    const layout = {
      hLineWidth: () => 1,
      vLineWidth: (i: number, node: any) =>
        (i === 0 || i === node.table.widths.length) ? 0 : 1,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3
    };

    return {
      table: {
        headerRows: 1,
        widths,
        body: [headerRow, ...dataRows, totalRow]
      },
      layout,
      margin: opts.margin
    };
  }

  if (fclLcl === 'FCL') {
    columns = [
      { header: 'Cargo Type', field: 'CargoType', width: 58 },
      { header: 'Cargo Desc', field: 'CargoDesc', width: '*' },
      { header: 'Product Name', field: 'ProductName', width: 62 },
      { header: 'Cont. Type', field: 'ContainerType', width: 50 },
      { header: 'No. of Cont.', field: 'NoofContainers', width: 42, alignment: 'right', format: 'number' },
      { header: 'Pkg Type', field: 'PackageType', width: 38 },
      { header: 'Gross Wt.', field: 'GrossWeight', width: 44, alignment: 'right', format: 'number', decimals: 3 },
      { header: 'CBM', field: 'Volume', width: 40, alignment: 'right', format: 'number', decimals: 3 }
    ];

    const headerRow = columns.map(col => ({
      text: col.header,
      style: opts.headerStyle,
      alignment: 'center',
      noWrap: true
    }));

    const dataRows = cargo.map((row, rowIndex) => {
      return columns.map(col => {
        let value = row[col.field];
        let displayValue = '';

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

        if (opts.alternateRowColors && rowIndex % 2 === 1) {
          cell.fillColor = opts.alternateColor;
        }

        return cell;
      });
    });

    const totalGrossWeight = cargo.reduce((sum, item) => sum + (Number(item.GrossWeight) || 0), 0);
    const totalVolume = cargo.reduce((sum, item) => sum + (Number(item.Volume) || 0), 0);

    const totalRow: any[] = columns.map(() => ({ text: '', style: opts.cellStyle }));
    totalRow[5] = { text: 'Total', style: opts.cellStyle, alignment: 'right' };
    totalRow[6] = { text: formatNumber(totalGrossWeight, 3), style: opts.cellStyle, alignment: 'right' };
    totalRow[7] = { text: formatNumber(totalVolume, 3), style: opts.cellStyle, alignment: 'right' };

    const widths = columns.map(col => col.width || '*');
    const layout = {
      hLineWidth: () => 1,
      vLineWidth: (i: number, node: any) =>
        (i === 0 || i === node.table.widths.length) ? 0 : 1,
      hLineColor: () => '#000000',
      vLineColor: () => '#000000',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3
    };

    return {
      table: {
        headerRows: 1,
        widths,
        body: [headerRow, ...dataRows, totalRow]
      },
      layout,
      margin: opts.margin
    };
  }

  columns = [
    { header: 'Cargo Type', field: 'CargoType', width: 60 },
    { header: 'Cargo Desc', field: 'CargoDesc', width: '*' },
    { header: 'Product Name', field: 'ProductName', width: 62 },
    { header: 'Chargeable Wt.', field: 'ChargeableWeight', width: 68, alignment: 'right', format: 'number', decimals: 3 },
    { header: 'Qty.', field: 'Qty', width: 28, alignment: 'right', format: 'number' },
    { header: 'Wt.Unit', field: 'WeightUnit', width: 34 },
    { header: 'Pkg Type', field: 'PackageType', width: 38 },
    { header: 'Gross Wt.', field: 'GrossWeight', width: 44, alignment: 'right', format: 'number', decimals: 3 },
    { header: 'CBM', field: 'Volume', width: 34, alignment: 'right', format: 'number', decimals: 3 }
  ];

  const headerRow = columns.map(col => ({
    text: col.header,
    style: opts.headerStyle,
    alignment: 'center',
    noWrap: true
  }));

  const dataRows = cargo.map((row, rowIndex) => {
    return columns.map(col => {
      let value = row[col.field];
      let displayValue = '';

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

      if (opts.alternateRowColors && rowIndex % 2 === 1) {
        cell.fillColor = opts.alternateColor;
      }

      return cell;
    });
  });

  const totalQty = cargo.reduce((sum, item) => sum + (Number(item.Qty) || 0), 0);
  const totalGrossWeight = cargo.reduce((sum, item) => sum + (Number(item.GrossWeight) || 0), 0);
  const totalVolume = cargo.reduce((sum, item) => sum + (Number(item.Volume) || 0), 0);

  const totalRow: any[] = columns.map(() => ({ text: '', style: opts.cellStyle }));
  totalRow[2] = { text: 'Total', style: opts.cellStyle, alignment: 'right' };
  totalRow[4] = { text: formatNumber(totalQty, 0), style: opts.cellStyle, alignment: 'right' };
  totalRow[7] = { text: formatNumber(totalGrossWeight, 3), style: opts.cellStyle, alignment: 'right' };
  totalRow[8] = { text: formatNumber(totalVolume, 3), style: opts.cellStyle, alignment: 'right' };

  const widths = columns.map(col => col.width || '*');
  const layout = {
    hLineWidth: () => 1,
    vLineWidth: (i: number, node: any) =>
      (i === 0 || i === node.table.widths.length) ? 0 : 1,
    hLineColor: () => '#000000',
    vLineColor: () => '#000000',
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 3,
    paddingBottom: () => 3
  };

  return {
    table: {
      headerRows: 1,
      widths,
      body: [headerRow, ...dataRows, totalRow]
    },
    layout,
    margin: opts.margin
  };
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
    columnGap?: number;
    rowGap?: number;
    fontSize?: number;
    leftLabelWidth?: number;
    rightLabelWidth?: number;
  } = {}
): any {
  const {
    labelWidth = 100,
    margin = [0, 0, 0, 15],
    columnGap = 0,
    rowGap = 0,
    fontSize,
    leftLabelWidth,
    rightLabelWidth
  } = options;

  const buildColumn = (items: { label: string; value: string }[], widthOverride?: number) => {
    const effectiveLabelWidth = widthOverride ?? labelWidth;
    return items.map(item => ({
      columns: [
        { text: item.label, style: 'labelBold', width: effectiveLabelWidth, fontSize },
        { text: ':', width: 6, alignment: 'right', fontSize },
        { text: item.value || '', width: '*', fontSize }
      ],
      margin: [0, 0, 0, rowGap]
    }));
  };

  return {
    columns: [
      { stack: buildColumn(leftItems, leftLabelWidth), width: '50%' },
      { stack: buildColumn(rightItems, rightLabelWidth), width: '50%' }
    ],
    columnGap,
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
