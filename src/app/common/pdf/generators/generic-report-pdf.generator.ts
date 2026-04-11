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
  _sideColumnWidth = 170
): any[] {
  const slots: Record<HeaderPosition, any> = {
    left: { width: '*', stack: [], alignment: 'left' },
    center: { width: '*', stack: [], alignment: 'center' },
    right: { width: '*', stack: [], alignment: 'right' }
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
  const infoContent: any[] = [];
  if (exportConfig.reportHeader.additionalInfo?.length) {
    const items = exportConfig.reportHeader.additionalInfo;
    const numCols = 2;
    const numRows = Math.ceil(items.length / numCols);
    const tableBody: any[][] = [];
    for (let r = 0; r < numRows; r++) {
      const leftIdx = r;
      const rightIdx = r + numRows;
      const leftItem = leftIdx < items.length ? items[leftIdx] : null;
      const rightItem = rightIdx < items.length ? items[rightIdx] : null;
      tableBody.push([
        { text: leftItem?.label || '', bold: true, fontSize: 8 },
        { text: leftItem ? `: ${leftItem.value || ''}` : '', fontSize: 8 },
        { text: rightItem?.label || '', bold: true, fontSize: 8 },
        { text: rightItem ? `: ${rightItem.value || ''}` : '', fontSize: 8 }
      ]);
    }
    infoContent.push({
      table: { widths: ['auto', '*', 'auto', 'auto'], body: tableBody },
      layout: 'noBorders',
      margin: [0, 0, 0, 20]
    });
  }

  const reportTitle = exportConfig.reportHeader.reportTitle || '';
  const lineWidth = isLandscape ? 782 : 535;

  function portraitHeader(data: GenericReportPdfData): any {
    const { company, branch, logo, exportConfig } = data;
    const stack: any[] = [];

    // Company info stack
    const companyStack: any[] = [];
    if (company?.companyName)
      companyStack.push({
        text: String(company.companyName).toUpperCase(),
        bold: true,
        fontSize: 12,
        alignment: printSettings.companyAlignment,
        noWrap: true
      });
    if (branch?.branchName)
      companyStack.push({
        text: branch.branchName,
        fontSize: 10,
        alignment: printSettings.companyAlignment,
        color: '#000000',
        noWrap: true
      });
    const addressLine = branch?.addressLine1 || company?.addressLine1 || '';
    if (addressLine)
      companyStack.push({
        text: addressLine,
        fontSize: 8,
        alignment: printSettings.companyAlignment,
        color: '#000000',
        noWrap: true
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
        fontSize: 10,
        alignment: printSettings.companyAlignment,
        color: '#000000',
        noWrap: true
      });
    }

    stack.push({
      columns: [
        {
          width: 90,
          stack: printSettings.logoPosition === 'left' && logo
            ? [{ image: logo, height: 60, alignment: 'left' }]
            : [],
          alignment: 'left'
        },
        {
          width: '*',
          stack: printSettings.companyPosition === 'center'
            ? companyStack
            : [],
          alignment: printSettings.companyAlignment,
          margin: [0, 4, 0, 0]
        },
        {
          width: 90,
          stack: printSettings.logoPosition === 'right' && logo
            ? [{ image: logo, height: 60, alignment: 'right' }]
            : [],
          alignment: 'right'
        }
      ],
      columnGap: 16,
      margin: [0, 0, 0, 8]
    });

    if (printSettings.companyPosition !== 'center') {
      stack.unshift({
        columns: buildHeaderSlots(
          null,
          {
            stack: companyStack,
            alignment: printSettings.companyAlignment,
            margin: [0, 4, 0, 0]
          },
          printSettings
        ),
        margin: [0, 0, 0, 8]
      });
    }

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
    if (exportConfig.reportHeader.additionalInfo?.length) {
      const items = exportConfig.reportHeader.additionalInfo;
      const numCols = 2;
      const numRows = Math.ceil(items.length / numCols);
      const tableBody: any[][] = [];
      for (let r = 0; r < numRows; r++) {
        const leftIdx = r;
        const rightIdx = r + numRows;
        const leftItem = leftIdx < items.length ? items[leftIdx] : null;
        const rightItem = rightIdx < items.length ? items[rightIdx] : null;

        tableBody.push([
          { text: leftItem?.label || '', bold: true, fontSize: 9 },
          { text: leftItem ? `: ${leftItem.value || ''}` : '', fontSize: 9 },
          { text: rightItem?.label || '', bold: true, fontSize: 9, alignment: 'right' },
          { text: rightItem ? `: ${rightItem.value || ''}` : '', fontSize: 9 }
        ]);
      }

      stack.push({
        table: { widths: [110, '*', 110, '*'], body: tableBody },
        layout: 'noBorders',
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
    if (infoContent.length) {
      stack.push(...infoContent);
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
  const hasDataRows = exportConfig.rows.some(r => r.style !== 'total' && r.style !== 'grandTotal' && r.style !== 'section');
  let bodyRows: any[][];
  if (hasDataRows) {
    bodyRows = exportConfig.rows.map(row =>
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
    ...exportConfig.rows.map(r => {
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

  // Notes section
  if (exportConfig.notes?.length) {
    const noteItems = exportConfig.notes.map(n => ({ text: n, fontSize: 8, margin: [0, 1, 0, 1] as [number, number, number, number] }));
    content.push({
      stack: [
        { text: 'Note :', bold: true, fontSize: 9, margin: [0, 6, 0, 2] },
        { ul: noteItems, fontSize: 8, margin: [10, 0, 0, 0] }
      ],
      margin: [0, 0, 0, 6]
    });
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
  const paramCount = exportConfig.reportHeader.additionalInfo?.length || 0;
  const paramRows = Math.ceil(paramCount / 2);
  const headerBaseHeight = isLandscape ? 140 : 150;
  const topMargin = headerBaseHeight + (paramRows * (isLandscape ? 11 : 18)) + 12;

  return {
    pageSize: 'A4',
    pageOrientation: orientation || 'portrait',
    pageMargins: [30, topMargin, 30, 30] as [number, number, number, number],
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
    footer: createFooterFunction(userData, {showPageNumbers: true}),
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
