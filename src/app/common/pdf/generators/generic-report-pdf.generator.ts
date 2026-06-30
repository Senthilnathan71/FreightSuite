/**
 * Generic Report PDF Generator
 * Converts ComplexReportExportConfig (used by all account/operation report components)
 * into a pdfmake document definition.
 */

import { ComplexReportExportConfig, ExcelRow } from 'src/app/shared/excel-report-service';
import { PdfCompanyInfo, PdfBranchInfo, PdfUserInfo } from '../interfaces/pdf-base.interface';
import { createFooterFunction } from '../builders/pdf-footer.builder';
import { getPdfStyles } from '../styles/pdf-styles';

export interface GenericReportPdfData {
  exportConfig: ComplexReportExportConfig;
  company: PdfCompanyInfo;
  branch: PdfBranchInfo;
  userData: PdfUserInfo;
  logo?: string;
  orientation?: 'portrait' | 'landscape';
}

type HeaderPosition = 'left' | 'center' | 'right';

interface GenericHeaderPrintSettings {
  logoPosition: HeaderPosition;
  companyPosition: HeaderPosition;
  companyAlignment: 'left' | 'center' | 'right';
}

interface AdditionalInfoLayoutResult {
  node: any | null;
  rowCount: number;
}

/** Compact table layout with reduced padding to fit more columns */
const COMPACT_TABLE_LAYOUT = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => '#000000',
  vLineColor: () => '#000000',
  paddingLeft: () => 2,
  paddingRight: () => 2,
  paddingTop: () => 2,
  paddingBottom: () => 2
};

function getGenericHeaderPrintSettings(): GenericHeaderPrintSettings {
  try {
    const raw = localStorage.getItem('companyPrintSettings');
    if (!raw) {
      return {
        logoPosition: 'left',
        companyPosition: 'center',
        companyAlignment: 'center'
      };
    }

    const parsed = JSON.parse(raw);
    return {
      logoPosition: parsed?.logoPosition || 'left',
      companyPosition: parsed?.companyPosition || 'center',
      companyAlignment: parsed?.companyAlignment || 'center'
    };
  } catch {
    return {
      logoPosition: 'left',
      companyPosition: 'center',
      companyAlignment: 'center'
    };
  }
}

function buildHeaderSlots(
  logoNode: any,
  companyNode: any,
  printSettings: GenericHeaderPrintSettings,
  sideColumnWidth = 170
): any[] {
  const widths = getHeaderWidths(
    printSettings.logoPosition,
    printSettings.companyPosition,
    sideColumnWidth
  );
  const slots: Record<HeaderPosition, any> = {
    left: { width: widths[0], stack: [], alignment: 'left' },
    center: { width: widths[1], stack: [], alignment: 'center' },
    right: { width: widths[2], stack: [], alignment: 'right' }
  };

  if (logoNode) {
    slots[printSettings.logoPosition].stack.push({
      ...logoNode,
      alignment: printSettings.logoPosition
    });
  }

  if (companyNode) {
    slots[printSettings.companyPosition].stack.push({
      ...companyNode,
      alignment: printSettings.companyAlignment
    });
  }

  return (['left', 'center', 'right'] as HeaderPosition[]).map(position => {
    const slot = slots[position];
    if (!slot.stack.length) {
      return {
        text: '',
        width: slot.width,
        alignment: slot.alignment
      };
    }

    return {
      width: slot.width,
      stack: slot.stack,
      alignment: slot.alignment
    };
  });
}

function getHeaderWidths(
  logoPosition: HeaderPosition,
  companyPosition: HeaderPosition,
  sideColumnWidth: number
): [any, any, any] {
  if (companyPosition === 'center' && logoPosition !== 'center') {
    return [sideColumnWidth, '*', sideColumnWidth];
  }

  if (companyPosition === 'right' && logoPosition === 'left') {
    return [sideColumnWidth, '*', Math.max(sideColumnWidth * 2, 220)];
  }

  if (companyPosition === 'left' && logoPosition === 'right') {
    return [Math.max(sideColumnWidth * 2, 220), '*', sideColumnWidth];
  }

  return ['33%', '34%', '33%'];
}

function buildMainTableLayout(
  rowMeta: Array<{ style: string; borderlessSection: boolean }>,
  suppressSectionBorders = false,
  suppressInnerDataRowLines = false
) {
  if (!suppressSectionBorders && !suppressInnerDataRowLines) {
    return COMPACT_TABLE_LAYOUT;
  }

  return {
    ...COMPACT_TABLE_LAYOUT,
    hLineWidth: (i: number) => {
      const prev = i > 0 ? rowMeta[i - 1] : undefined;
      const next = i < rowMeta.length ? rowMeta[i] : undefined;
      const prevStyle = prev?.style;
      const nextStyle = next?.style;
      if (suppressInnerDataRowLines && prevStyle === 'data' && nextStyle === 'data') {
        return 0;
      }
      if (
        suppressSectionBorders &&
        prevStyle === 'section' &&
        nextStyle === 'section' &&
        prev?.borderlessSection &&
        !next?.borderlessSection
      ) {
        return 0.5;
      }
      if (prevStyle === 'total' && nextStyle === 'section') {
        return 0.5;
      }
      if (
        suppressSectionBorders &&
        ((prevStyle === 'section' && prev?.borderlessSection) || (nextStyle === 'section' && next?.borderlessSection))
      ) {
        return 0;
      }
      return 0.5;
    }
  };
}

function isAmountInWordsRow(row: ExcelRow): boolean {
  const firstCellText = String(row.cells?.[0]?.value ?? '').trim().toLowerCase();
  return firstCellText === 'amount in words';
}

function getAmountInWordsText(rows: ExcelRow[]): string {
  return rows
    .map(row => {
      const valueCell = row.cells.find((cell, index) => index > 0 && String(cell?.value ?? '').trim());
      return String(valueCell?.value ?? '').trim();
    })
    .filter(Boolean)
    .join(' ');
}

function buildAdditionalInfoLayout(
  items: { label: string; value: string }[] | undefined,
  isLandscape: boolean,
  fontSize: number
): AdditionalInfoLayoutResult {
  if (!items?.length) {
    return { node: null, rowCount: 0 };
  }

  const columnCount = Math.min(2, items.length);
  const rowCount = Math.ceil(items.length / columnCount);
  const labelWidth = isLandscape ? 56 : 62;

  // Split into a left group (first rowCount items) and a right group (the rest).
  const leftItems = items.slice(0, rowCount);
  const rightItems = columnCount > 1 ? items.slice(rowCount) : [];

  // Each group is a borderless table [ label | : | value ]. An 'auto' value column
  // makes the table shrink to its actual content width, so when the right group is
  // anchored to the page end (via a '*' spacer) it truly hugs the right edge with no
  // trailing gap, while the table grid keeps every label/colon/value aligned.
  const groupLayout = {
    defaultBorder: false,
    paddingLeft: () => 0,
    paddingRight: () => 4,
    paddingTop: () => 1,
    paddingBottom: () => 1
  };

  const buildGroupTable = (groupItems: { label: string; value: string }[]) => ({
    table: {
      widths: [labelWidth, 'auto', 'auto'],
      body: groupItems.map(item => [
        { text: item?.label || '', bold: true, fontSize, noWrap: true },
        { text: ':', fontSize, alignment: 'center' },
        { text: item?.value || '', fontSize }
      ])
    },
    layout: groupLayout
  });

  return {
    rowCount,
    node: {
      columns: [
        { width: 'auto', ...buildGroupTable(leftItems) },
        { width: '*', text: '' },
        rightItems.length
          ? { width: 'auto', ...buildGroupTable(rightItems) }
          : { width: 0, text: '' }
      ],
      columnGap: 0
    }
  };
}

function estimateHeaderTopMargin(opts: {
  isLandscape: boolean;
  hasLogo: boolean;
  companyLineCount: number;
  hasTitle: boolean;
  parameterRows: number;
}): number {
  const lineHeight = opts.isLandscape ? 8 : 9;
  const logoHeight = opts.hasLogo ? 42 : 0;
  const companyHeight = opts.companyLineCount * lineHeight;
  const headerBlockHeight = Math.max(logoHeight, companyHeight);
  const titleHeight = opts.hasTitle ? (opts.isLandscape ? 18 : 22) : 0;
  const paramsHeight = opts.parameterRows > 0
    ? opts.parameterRows * (opts.isLandscape ? 16 : 22) + (opts.isLandscape ? 10 : 18)
    : 0;
  const padding = opts.isLandscape ? 24 : 34;

  const computed = Math.ceil(15 + headerBlockHeight + titleHeight + paramsHeight + padding);
  return opts.isLandscape ? computed : Math.max(170, computed);
}

export function generateGenericReportDocument(data: GenericReportPdfData): any {
  const { exportConfig, company, branch, userData, logo, orientation } = data;
  const printSettings = getGenericHeaderPrintSettings();
  const isLandscape = orientation === 'landscape';
  const logoHeight = 60;
  const colCount = exportConfig.tableHeaders.length;
  const includeTableHeaders = exportConfig.includeTableHeaders !== false;
  const suppressSectionBorders = exportConfig.suppressSectionBorders === true;
  const suppressInnerDataRowLines = exportConfig.suppressInnerDataRowLines === true;
  const borderlessSectionTextSet = new Set(
    (exportConfig.suppressSectionBordersByText || []).map(v => String(v).trim().toUpperCase())
  );

  // --- A) Fix column widths: scale proportionally, accounting for border+padding overhead ---
  const pageWidth = isLandscape ? 842 : 595;
  const availableWidth = pageWidth - 30 - 30; // left + right margins
  let widths: any[];
  if (exportConfig.columnWidths?.length === colCount) {
    const totalWeight = exportConfig.columnWidths.reduce((a, b) => a + b, 0);
    // Subtract border and padding overhead so the table fits within the page
    const borderOverhead = (colCount + 1) * 0.5;   // 0.5pt per border line
    const paddingOverhead = colCount * (2 + 2);     // left(2) + right(2) per cell
    const availableContentWidth = availableWidth - borderOverhead - paddingOverhead;
    widths = exportConfig.columnWidths.map(w => (w / totalWeight) * availableContentWidth);
  } else {
    widths = Array(colCount).fill('*');
  }

  // --- B) Build repeating header function ---
  const landscapeAdditionalInfo = buildAdditionalInfoLayout(
    exportConfig.reportHeader.additionalInfo,
    true,
    8
  );

  const reportTitle = exportConfig.reportHeader.reportTitle || '';

  function portraitHeader(data: GenericReportPdfData): any {
    const { company, branch, logo, exportConfig } = data;
    const stack: any[] = [];
    const printableWidth = 595 - 60;
    const sideColumnWidth = Math.min(100, Math.max(76, Math.floor(printableWidth * 0.18)));

    // Company info stack
    const companyStack: any[] = [];
    if (company?.companyName)
      companyStack.push({
        text: String(company.companyName).toUpperCase(),
        bold: true,
        fontSize: 11,
        alignment: printSettings.companyAlignment
      });
    if (branch?.branchName)
      companyStack.push({
        text: branch.branchName,
        fontSize: 9,
        alignment: printSettings.companyAlignment,
        color: '#000000'
      });
    const addressLine = branch?.addressLine1 || company?.addressLine1 || '';
    if (addressLine)
      companyStack.push({
        text: addressLine,
        fontSize: 8,
        alignment: printSettings.companyAlignment,
        color: '#000000'
      });

    const portraitAddressLine2 = branch?.addressLine2 || '';
    const portraitCityName = branch?.cityMaster?.cityName || branch?.cityName || '';
    const portraitPostalCode =
      branch?.postalCode || (branch as any)?.ZipCode || company?.postalCode || (company as any)?.ZipCode || '';
    const portraitPhoneNumber =
      branch?.phoneNumber || (branch as any)?.Phone || company?.phoneNumber || (company as any)?.Phone || '';

    const portraitLineParts: any[] = [];
    if (portraitAddressLine2) {
      portraitLineParts.push({ text: portraitAddressLine2 });
    }
    if (portraitCityName) {
      portraitLineParts.push({ text: `${portraitLineParts.length ? ', ' : ''}${portraitCityName}` });
    }
    if (portraitPostalCode) {
      portraitLineParts.push({ text: `${portraitLineParts.length ? ', ' : ''}` });
      portraitLineParts.push({ text: 'Postal Code : ', bold: true });
      portraitLineParts.push({ text: portraitPostalCode });
    }
    if (portraitPhoneNumber) {
      portraitLineParts.push({ text: `${portraitLineParts.length ? ', ' : ''}` });
      portraitLineParts.push({ text: 'Ph.no : ', bold: true });
      portraitLineParts.push({ text: portraitPhoneNumber });
    }
    if (portraitLineParts.length) {
      companyStack.push({
        text: portraitLineParts,
        fontSize: 8,
        alignment: printSettings.companyAlignment,
        color: '#000000',
        noWrap: true
      });
    }

    stack.push({
      columns: [
        ...buildHeaderSlots(
          logo
            ? {
                image: logo,
                height: 60,
                alignment: printSettings.logoPosition
              }
            : null,
          {
            stack: companyStack,
            alignment: printSettings.companyAlignment,
            margin: [0, 4, 0, 0]
          },
          printSettings,
          sideColumnWidth
        )
      ],
      columnGap: 16,
      margin: [0, 0, 0, 8]
    });

    // Report title
    if (exportConfig.reportHeader.reportTitle) {
      stack.push({
        text: exportConfig.reportHeader.reportTitle,
        bold: true,
        fontSize: 11,
        alignment: 'center',
        margin: [0, 8, 0, 12],
      });
    }

    // Additional info (parameters)
    // Portrait-only layout: a single full-width two-column table. Because the
    // table spans the full printable width (no auto-sized side tables that can
    // collide in the narrow portrait page), every parameter renders on its own
    // row — including ones with an empty value (label shown with a blank value).
    const paramItems = exportConfig.reportHeader.additionalInfo || [];
    if (paramItems.length) {
      const numRows = Math.ceil(paramItems.length / 2);
      const body: any[][] = [];
      for (let r = 0; r < numRows; r++) {
        const left = paramItems[r];
        const right = paramItems[r + numRows];
        body.push([
          { text: left?.label || '', bold: true, fontSize: 9, noWrap: true },
          { text: left ? ':' : '', fontSize: 9, alignment: 'center' },
          { text: left?.value || '', fontSize: 9 },
          { text: right?.label || '', bold: true, fontSize: 9, noWrap: true },
          { text: right ? ':' : '', fontSize: 9, alignment: 'center' },
          { text: right?.value || '', fontSize: 9 }
        ]);
      }
      stack.push({
        table: { widths: [62, 8, '*', 62, 8, '*'], body },
        layout: {
          defaultBorder: false,
          paddingLeft: () => 0,
          paddingRight: () => 4,
          paddingTop: () => 1,
          paddingBottom: () => 1
        },
        margin: [0, 6, 0, 6],
      });
    }

    return { margin: [30, 15, 30, 0], stack };
  }
  const headerFunction = (_currentPage: number, _pageCount: number, _pageSize: any) => {
    const stack: any[] = [];
    const printableWidth = (_pageSize?.width || pageWidth) - 60; // page width - left/right margins
    const sideColumnWidth = isLandscape
      ? 170
      : Math.min(120, Math.max(90, Math.floor(printableWidth * 0.22)));

    // Build company info stack (center column)
    const companyStack: any[] = [];

    // Company name
    if (company?.companyName) {
      companyStack.push({
        text: String(company.companyName).toUpperCase(),
        bold: true,
        fontSize: 12,
        alignment: printSettings.companyAlignment
      });
    }

    // Branch name
    if (branch?.branchName) {
      companyStack.push({
        text: branch.branchName,
        fontSize: 9,
        alignment: printSettings.companyAlignment,
        color: '#000000'
      });
    }

    // Address line 1
    const addressLine = branch?.addressLine1 || company?.addressLine1 || '';
    if (addressLine) {
      companyStack.push({
        text: addressLine,
        fontSize: 8,
        alignment: printSettings.companyAlignment,
        color: '#000000'
      });
    }

    // Address line 2 (addressLine2, city, postalCode, phone)
    const landscapeAddressLine2 = branch?.addressLine2?.trim() || '';
    const cityName = branch?.cityMaster?.cityName || branch?.cityName || '';
    const landscapePostalCode =
      branch?.postalCode || (branch as any)?.ZipCode || company?.postalCode || (company as any)?.ZipCode || '';
    const landscapePhoneNumber =
      branch?.phoneNumber || (branch as any)?.Phone || company?.phoneNumber || (company as any)?.Phone || '';

    const landscapeLineParts: any[] = [];
    if (landscapeAddressLine2) {
      landscapeLineParts.push({ text: landscapeAddressLine2 });
    }
    if (cityName) {
      landscapeLineParts.push({ text: `${landscapeLineParts.length ? ', ' : ''}${cityName}` });
    }
    if (landscapePostalCode) {
      landscapeLineParts.push({ text: `${landscapeLineParts.length ? ', ' : ''}` });
      landscapeLineParts.push({ text: 'Postal Code : ', bold: true });
      landscapeLineParts.push({ text: landscapePostalCode });
    }
    if (landscapePhoneNumber) {
      landscapeLineParts.push({ text: `${landscapeLineParts.length ? ', ' : ''}` });
      landscapeLineParts.push({ text: 'Ph.no : ', bold: true });
      landscapeLineParts.push({ text: landscapePhoneNumber });
    }
    if (landscapeLineParts.length) {
      companyStack.push({
        text: landscapeLineParts,
        fontSize: 8,
        alignment: printSettings.companyAlignment,
        color: '#000000'
      });
    }

    stack.push({
      columns: buildHeaderSlots(
        logo
          ? {
              image: logo,
              height: logoHeight,
              alignment: printSettings.logoPosition
            }
          : null,
        { stack: companyStack, alignment: printSettings.companyAlignment },
        printSettings,
        sideColumnWidth
      ),
      margin: [0, 2, 0, 2]
    });

    // Report title
    if (reportTitle) {
      stack.push({
        text: reportTitle,
        bold: true,
        fontSize: 11,
        alignment: 'center',
        margin: [0, 4, 0, 3]
      });
    }

    // Parameters
    if (landscapeAdditionalInfo.node) {
      stack.push({
        ...landscapeAdditionalInfo.node,
        margin: [0, 2, 0, 6]
      });
    }

    // Thin divider line
    // stack.push({
    //   canvas: [{ type: 'line', x1: 0, y1: 0, x2: lineWidth, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }],
    //   margin: [0, 3, 0, 0]
    // });

    return {
      margin: [30, 15, 30, 0],
      stack
    };
  };

  // --- C) Table header with #116897 background, white text ---
  const headerRow = exportConfig.tableHeaders.map(h => ({
    text: h.label,
    bold: true,
    fontSize: 7,
    color: '#ffffff',
    fillColor: '#116897',
    alignment: 'center' as const
  }));

  // --- D) Data rows with right-aligned numeric values ---
  const amountInWordsRows = exportConfig.rows.filter(isAmountInWordsRow);
  const displayRows = exportConfig.rows.filter(row => !isAmountInWordsRow(row));
  const hasDataRows = displayRows.some(r => r.style !== 'total' && r.style !== 'grandTotal' && r.style !== 'section');
  let bodyRows: any[][];
  if (hasDataRows) {
    bodyRows = displayRows.map(row =>
      buildPdfRow(
        row,
        colCount,
        suppressSectionBorders,
        borderlessSectionTextSet,
        exportConfig.sectionRowFillByText
      )
    );
  } else {
    // No actual data — show "No Record Found" spanning all columns
    const noRecordRow: any[] = [
      { text: 'No Record Found', colSpan: colCount, alignment: 'center', fontSize: 8, bold: true, margin: [0, 4, 0, 4] }
    ];
    for (let i = 1; i < colCount; i++) noRecordRow.push({ text: '' });
    bodyRows = [noRecordRow];
  }
  const mainRowMeta = [
    ...(includeTableHeaders ? [{ style: 'header', borderlessSection: false }] : []),
    ...displayRows.map(r => {
      const style = r.style || 'data';
      const text = String(r.cells?.[0]?.value ?? '').trim().toUpperCase();
      const borderlessSection =
        style === 'section' &&
        (suppressSectionBorders
          ? (borderlessSectionTextSet.size === 0 || borderlessSectionTextSet.has(text))
          : false);
      return { style, borderlessSection };
    })
  ];
  const mainTableLayout = buildMainTableLayout(
    mainRowMeta,
    suppressSectionBorders,
    suppressInnerDataRowLines
  );

  // Build content array
  const content: any[] = [
    // Main data table
    {
      table: {
        headerRows: includeTableHeaders ? 1 : 0,
        widths: widths,
        body: includeTableHeaders ? [headerRow, ...bodyRows] : bodyRows
      },
      layout: mainTableLayout,
      fontSize: 7,
      margin: [0, 0, 0, 10]
    }
  ];

  const amountInWordsText = getAmountInWordsText(amountInWordsRows);
  if (amountInWordsText) {
    content.push({
      columns: [
        { text: 'Amount in words', width: 78, bold: true, fontSize: 8 },
        { text: ':', width: 5, fontSize: 8 },
        { text: amountInWordsText, width: '*', fontSize: 8 }
      ],
      columnGap: 0,
      margin: [0, -6, 0, 8]
    });
  }

  // Notes section. When `notesEveryPage` is set the notes are rendered in the page
  // footer instead (repeated on every page), so skip the once-at-end block here.
  const repeatNotesInFooter = exportConfig.notesEveryPage === true && !!exportConfig.notes?.length;
  const notesLabel = String(exportConfig.notesLabel || 'Note').trim() || 'Note';
  if (exportConfig.notes?.length && !repeatNotesInFooter) {
    const noteItems = exportConfig.notes.map(n => ({ text: n, fontSize: 8, margin: [0, 1, 0, 1] as [number, number, number, number] }));

    if (notesLabel.toLowerCase() === 'amount in words') {
      content.push({
        columns: [
          { text: 'Amount in words', width: 78, bold: true, fontSize: 8 },
          { text: ':', width: 5, fontSize: 8 },
          { text: exportConfig.notes[0] || '', width: '*', fontSize: 8 }
        ],
        columnGap: 0,
        margin: [0, 6, 0, 6]
      });
    } else {
      content.push({
        stack: [
          { text: `${notesLabel} :`, bold: true, fontSize: 9, margin: [0, 6, 0, 2] },
          { ul: noteItems, fontSize: 8, margin: [10, 0, 0, 0] }
        ],
        margin: [0, 0, 0, 6]
      });
    }
  }

  // Summary table (e.g., currency-wise summary in Outstanding Report)
  if (exportConfig.summaryTable) {
    const st = exportConfig.summaryTable;
    const stColCount = st.headers.length;

    // Calculate summary table widths
    let stWidths: any[];
    if (st.columnWidths?.length === stColCount) {
      const stTotalWeight = st.columnWidths.reduce((a, b) => a + b, 0);
      const stBorderOverhead = (stColCount + 1) * 0.5;
      const stPaddingOverhead = stColCount * (2 + 2);
      const stAvailable = availableWidth - stBorderOverhead - stPaddingOverhead;
      stWidths = st.columnWidths.map(w => (w / stTotalWeight) * stAvailable);
    } else {
      stWidths = Array(stColCount).fill('*');
    }

    // Summary header row with teal background
    const stHeaderRow = st.headers.map(label => ({
      text: label,
      bold: true, fontSize: 7, color: '#ffffff', fillColor: '#116897', alignment: 'left' as const
    }));

    // Summary data rows
    const stBodyRows = st.rows.map(row => {
      const cells: any[] = [];
      for (const cell of row.cells) {
        const cellText = cell.value != null ? String(cell.value) : '';
        const isNumeric = cellText !== '' && !isNaN(Number(cellText.replace(/,/g, '')));
        cells.push({ text: cellText, fontSize: 7, alignment: isNumeric ? 'right' as const : 'left' as const });
      }
      while (cells.length < stColCount) cells.push({ text: '' });
      return cells;
    });

    // Wrap title + table in unbreakable block so it stays together;
    // if it doesn't fit on the current page, pdfmake moves the whole block to the next page.
    const summaryStack: any[] = [];
    if (st.title) {
      summaryStack.push({
        text: st.title, bold: true, fontSize: 9, margin: [0, 10, 0, 4]
      });
    } else {
      summaryStack.push({ text: '', margin: [0, 6, 0, 0] });
    }
    summaryStack.push({
      table: { headerRows: 1, widths: stWidths, body: [stHeaderRow, ...stBodyRows] },
      layout: COMPACT_TABLE_LAYOUT,
      fontSize: 7,
      margin: [0, 0, 0, 10]
    });
    content.push({ stack: summaryStack, unbreakable: true });
  }

  if (exportConfig.additionalTables?.length) {
    for (const table of exportConfig.additionalTables) {
      const tableColCount = table.headers.length;

      let extraWidths: any[];
      if (table.columnWidths?.length === tableColCount) {
        const extraTotalWeight = table.columnWidths.reduce((a, b) => a + b, 0);
        const extraBorderOverhead = (tableColCount + 1) * 0.5;
        const extraPaddingOverhead = tableColCount * (2 + 2);
        const extraAvailable = availableWidth - extraBorderOverhead - extraPaddingOverhead;
        extraWidths = table.columnWidths.map(w => (w / extraTotalWeight) * extraAvailable);
      } else {
        extraWidths = Array(tableColCount).fill('*');
      }

      const extraHeaderRow = table.headers.map(label => ({
        text: label,
        bold: true,
        fontSize: 7,
        color: '#ffffff',
        fillColor: '#116897',
        alignment: 'left' as const
      }));

      const extraBodyRows = table.rows.map(row => {
        const cells: any[] = [];
        for (const cell of row.cells) {
          const cellText = cell.value != null ? String(cell.value) : '';
          const isNumeric = cellText !== '' && !isNaN(Number(cellText.replace(/,/g, '')));
          cells.push({
            text: cellText,
            fontSize: 7,
            alignment: cell.alignment?.horizontal || (isNumeric ? 'right' as const : 'left' as const)
          });
        }
        while (cells.length < tableColCount) {
          cells.push({ text: '' });
        }
        return cells;
      });

      const extraStack: any[] = [];
      if (table.title) {
        extraStack.push({
          text: table.title,
          bold: true,
          fontSize: 9,
          margin: [0, 10, 0, 4]
        });
      } else {
        extraStack.push({ text: '', margin: [0, 6, 0, 0] });
      }

      extraStack.push({
        table: {
          headerRows: 1,
          widths: extraWidths,
          body: [extraHeaderRow, ...extraBodyRows]
        },
        layout: COMPACT_TABLE_LAYOUT,
        fontSize: 7,
        margin: [0, 0, 0, 10]
      });

      content.push({ stack: extraStack, unbreakable: true });
    }
  }

  // Keep a visible gap between header parameter info and table content.
  const companyLineCount = [
    company?.companyName,
    branch?.branchName,
    branch?.addressLine1 || company?.addressLine1,
    branch?.addressLine2 || branch?.cityMaster?.cityName || branch?.cityName || branch?.postalCode || (branch as any)?.ZipCode || branch?.phoneNumber || (branch as any)?.Phone
  ].filter(Boolean).length;
  const parameterRows = isLandscape
    ? landscapeAdditionalInfo.rowCount
    : buildAdditionalInfoLayout(exportConfig.reportHeader.additionalInfo, false, 9).rowCount;
  const topMargin = estimateHeaderTopMargin({
    isLandscape,
    hasLogo: !!logo,
    companyLineCount,
    hasTitle: !!reportTitle,
    parameterRows
  });

  // Reserve extra bottom margin when notes repeat in the footer, so the legend never
  // overlaps the table (default footer needs ~30pt; each note line ~9pt).
  const footerNotes = repeatNotesInFooter ? exportConfig.notes! : undefined;
  const bottomMargin = footerNotes ? 30 + footerNotes.length * 9 : 30;

  return {
    pageSize: 'A4',
    pageOrientation: orientation || 'portrait',
    pageMargins: [30, topMargin, 30, bottomMargin] as [number, number, number, number],
    background: (_currentPage: number, pageSize: any) => ({
      canvas: [{
        type: 'rect',
        x: 14,
        y: 14,
        w: pageSize.width - 28,
        h: pageSize.height - 28,
        lineWidth: 0.7,
        lineColor: '#000000'
      }]
    }),
    header: (_currentPage: number, _pageCount: number, _pageSize: any) =>
      isLandscape
        ? headerFunction(_currentPage, _pageCount, _pageSize)
        : portraitHeader(data),
    content,
    footer: createFooterFunction(userData, {
      showPageNumbers: true,
      showDisclaimer: exportConfig.showFooterNote === true,
      footerNotes
    }),
    styles: getPdfStyles(),
    defaultStyle: { fontSize: 8, lineHeight: 1.2, color: '#333333' }
  };
}

/** Convert an ExcelRow to a pdfmake row (array of cells) */
function buildPdfRow(
  row: ExcelRow,
  colCount: number,
  suppressSectionBorders = false,
  borderlessSectionTextSet?: Set<string>,
  sectionRowFillByText?: Record<string, string>
): any[] {
  const cells: any[] = [];
  const isBold =
    row.style === 'total' ||
    row.style === 'grandTotal' ||
    row.style === 'section' ||
    row.style === 'header';
  const sectionLabel = String(row.cells?.[0]?.value ?? '').trim().toUpperCase();
  const isBorderlessSection =
    row.style === 'section' &&
    suppressSectionBorders &&
    (!borderlessSectionTextSet || borderlessSectionTextSet.size === 0 || borderlessSectionTextSet.has(sectionLabel));
  const mappedSectionFill =
    row.style === 'section' && sectionRowFillByText
      ? sectionRowFillByText[sectionLabel] || sectionRowFillByText[String(row.cells?.[0]?.value ?? '').trim()]
      : undefined;
  const fillColor = row.style === 'grandTotal' ? '#e0e0e0'
                   : row.style === 'total' ? '#f2f2f2'
                   : row.style === 'header' ? '#116897'
                   : row.style === 'section' ? (mappedSectionFill || '#f7f7f7')
                   : null;

  for (const cell of row.cells) {
    const cellText = cell.value != null ? String(cell.value) : '';
    const isNumeric = cellText !== '' && !isNaN(Number(cellText.replace(/,/g, '')));

    const pdfCell: any = {
      text: cellText,
      bold: isBold,
      fontSize: 7
    };
    if (cell.fillColor) {
      pdfCell.fillColor = cell.fillColor;
    } else if (fillColor) {
      pdfCell.fillColor = fillColor;
    }
    if (typeof cell.marginTop === 'number') {
      pdfCell.margin = [0, cell.marginTop, 0, 0];
    }
    if (cell.border) pdfCell.border = cell.border;
    if (row.style === 'header') pdfCell.color = '#ffffff';
    if (cell.alignment?.horizontal) {
      pdfCell.alignment = cell.alignment.horizontal;
    } else if (isNumeric) {
      pdfCell.alignment = 'right';
    }
    if (cell.alignment?.vertical) {
      const verticalMap: Record<'top' | 'middle' | 'bottom', 'top' | 'middle' | 'bottom'> = {
        top: 'top',
        middle: 'middle',
        bottom: 'bottom'
      };
      pdfCell.verticalAlignment = verticalMap[cell.alignment.vertical];
    }
    if (cell.colspan && cell.colspan > 1) {
      if (isBorderlessSection) {
        pdfCell.border = [false, false, false, false];
      }
      pdfCell.colSpan = cell.colspan;
      cells.push(pdfCell);
      // push empty cells for colspan
      for (let i = 1; i < cell.colspan; i++) {
        cells.push(isBorderlessSection
          ? { text: '', border: [false, false, false, false] }
          : { text: '' });
      }
    } else {
      if (cell.rowspan && cell.rowspan > 1) {
        pdfCell.rowSpan = cell.rowspan;
      }
      if (isBorderlessSection) {
        pdfCell.border = [false, false, false, false];
      }
      cells.push(pdfCell);
    }
  }

  // Pad if row has fewer cells than columns
  while (cells.length < colCount) cells.push({ text: '' });

  return cells;
}
