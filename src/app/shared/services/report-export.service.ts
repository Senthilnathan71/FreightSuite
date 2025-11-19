import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

export type ExportFormat = 'EXCEL' | 'PDF' | 'CSV';

@Injectable({
  providedIn: 'root'
})
export class ReportExportService {
  constructor() {}

  /**
   * Download blob as file with specified format
   */
  downloadFile(blob: Blob, filename: string, format: ExportFormat): void {
    const extension = this.getFileExtension(format);
    const fullFilename = `${filename}.${extension}`;
    saveAs(blob, fullFilename);
  }

  /**
   * Get file extension based on export format
   */
  private getFileExtension(format: ExportFormat): string {
    switch (format) {
      case 'EXCEL':
        return 'xlsx';
      case 'PDF':
        return 'pdf';
      case 'CSV':
        return 'csv';
      default:
        return 'xlsx';
    }
  }

  /**
   * Get MIME type for export format
   */
  getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'EXCEL':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'PDF':
        return 'application/pdf';
      case 'CSV':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Generate filename from report name and current date
   */
  generateFilename(reportName: string, format?: ExportFormat): string {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const sanitizedName = reportName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();

    if (format) {
      const extension = this.getFileExtension(format);
      return `${sanitizedName}_${timestamp}.${extension}`;
    }

    return `${sanitizedName}_${timestamp}`;
  }

  /**
   * Print report data (opens print dialog)
   */
  printReport(reportData: any[], reportName: string): void {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Please allow popups to print the report');
      return;
    }

    const html = this.generatePrintHTML(reportData, reportName);
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };
  }

  /**
   * Generate HTML for print view
   */
  private generatePrintHTML(reportData: any[], reportName: string): string {
    if (!reportData || reportData.length === 0) {
      return '<html><body><p>No data to print</p></body></html>';
    }

    const columns = Object.keys(reportData[0]);
    const headers = columns.map(col => `<th>${this.formatHeader(col)}</th>`).join('');
    const rows = reportData.map(row => {
      const cells = columns.map(col => `<td>${this.formatCellValue(row[col])}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportName}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .print-header { text-align: center; margin-bottom: 20px; }
              .print-header h1 { margin: 0; font-size: 24px; color: #333; }
              .print-header p { margin: 5px 0; color: #666; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { background-color: #007bff; color: white; padding: 8px; text-align: left; border: 1px solid #ddd; }
              td { padding: 6px; border: 1px solid #ddd; }
              tr:nth-child(even) { background-color: #f8f9fa; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${reportName}</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>${headers}</tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Format column header for display
   */
  private formatHeader(header: string): string {
    return header
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Format cell value for display
   */
  private formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return String(value);
  }

  /**
   * Export data to CSV format (client-side)
   */
  exportToCSVClientSide(reportData: any[], filename: string): void {
    if (!reportData || reportData.length === 0) {
      alert('No data to export');
      return;
    }

    const columns = Object.keys(reportData[0]);
    const csvHeaders = columns.join(',');
    const csvRows = reportData.map(row => {
      return columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',');
    }).join('\n');

    const csvContent = `${csvHeaders}\n${csvRows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename, 'CSV');
  }

  /**
   * Convert table data to Excel-compatible format (client-side basic version)
   */
  exportToExcelClientSide(reportData: any[], filename: string): void {
    // Note: This is a simple CSV-based approach. For full Excel features,
    // use the backend export endpoint which uses ExcelJS
    if (!reportData || reportData.length === 0) {
      alert('No data to export');
      return;
    }

    const columns = Object.keys(reportData[0]);
    const csvHeaders = columns.join('\t');
    const csvRows = reportData.map(row => {
      return columns.map(col => {
        const value = row[col];
        return value === null || value === undefined ? '' : String(value);
      }).join('\t');
    }).join('\n');

    const csvContent = `${csvHeaders}\n${csvRows}`;
    const blob = new Blob([csvContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    this.downloadFile(blob, filename, 'EXCEL');
  }

  /**
   * Validate export format
   */
  isValidFormat(format: string): format is ExportFormat {
    return ['EXCEL', 'PDF', 'CSV'].includes(format);
  }

  /**
   * Get format display name
   */
  getFormatDisplayName(format: ExportFormat): string {
    switch (format) {
      case 'EXCEL':
        return 'Excel (XLSX)';
      case 'PDF':
        return 'PDF Document';
      case 'CSV':
        return 'CSV File';
      default:
        return format;
    }
  }

  /**
   * Get format icon class
   */
  getFormatIcon(format: ExportFormat): string {
    switch (format) {
      case 'EXCEL':
        return 'mdi mdi-file-excel text-success';
      case 'PDF':
        return 'mdi mdi-file-pdf text-danger';
      case 'CSV':
        return 'mdi mdi-file-delimited text-info';
      default:
        return 'mdi mdi-file';
    }
  }
}
