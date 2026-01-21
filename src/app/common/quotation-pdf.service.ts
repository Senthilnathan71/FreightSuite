import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

export interface QuotationPdfData {
  company: any;
  branch: any;
  quotation: any;
  routes: any[];
  terms: any[];
  currencyMaster: any[];
  chargeUnitMaster: any[];
  departments: any[];
  ports: any[];
  userData: any;
  logo?: string;
}

@Injectable({ providedIn: 'root' })
export class QuotationPdfService {

  generateQuotationPDF(data: QuotationPdfData): void {
    const docDefinition = this.buildDocument(data);
    const filename = `Quotation_${data.quotation.QuoteNumber || 'Draft'}.pdf`;
    pdfMake.createPdf(docDefinition).download(filename);
  }

  async generateQuotationPDFBlob(data: QuotationPdfData): Promise<Blob> {
    const docDefinition = this.buildDocument(data);
    return new Promise((resolve, reject) => {
      pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
        resolve(blob);
      });
    });
  }

  private buildDocument(data: QuotationPdfData): any {
    const isContract = data.quotation?.IsContract === 'Y';
    const docTitle = isContract ? 'Contract' : 'Quotation';

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 60],
      content: [
        this.buildHeader(data),
        this.buildTitle(docTitle),
        this.buildCustomerInfo(data, isContract),
        this.buildGreeting(),
        ...this.buildRouteTables(data),
        this.buildTermsSection(data.terms),
        this.buildClosingMessage(),
        this.buildSignature(data)
      ],
      footer: (currentPage, pageCount) => this.buildFooter(data, currentPage, pageCount),
      styles: this.getStyles(),
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.2
      }
    };
  }

  private buildHeader(data: QuotationPdfData): any {
    const content: any[] = [];

    // Logo and Company Info row
    const headerColumns: any = {
      columns: [
        // Logo column
        data.logo ? {
          image: data.logo,
          width: 60,
          height: 60
        } : { text: '', width: 60 },
        // Company info column
        {
          stack: [
            { text: data.company?.companyName || 'Company Name', style: 'companyName', alignment: 'center' },
            { text: data.branch?.branchName || '', style: 'branchName', alignment: 'center' },
            { text: data.branch?.addressLine1 || '', style: 'addressText', alignment: 'center' },
            {
              text: [
                data.branch?.addressLine2 || '',
                data.branch?.addressLine2 ? ' ' : '',
                data.branch?.cityMaster?.cityName || data.company?.City || '',
                ', ',
                data.branch?.postalCode || data.branch?.ZipCode || '',
                ' - ',
                data.branch?.phoneNumber || data.branch?.Phone || ''
              ].join(''),
              style: 'addressText',
              alignment: 'center'
            }
          ],
          width: '*'
        },
        { text: '', width: 60 } // Spacer for balance
      ],
      margin: [0, 0, 0, 10]
    };

    content.push(headerColumns);

    return { stack: content };
  }

  private buildTitle(title: string): any {
    return {
      stack: [
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }]
        },
        {
          text: title,
          style: 'documentTitle',
          alignment: 'center',
          margin: [0, 10, 0, 10]
        }
      ]
    };
  }

  private buildCustomerInfo(data: QuotationPdfData, isContract: boolean): any {
    const quotation = data.quotation;
    const docTypeLabel = isContract ? 'Contract' : 'Quotation';

    return {
      columns: [
        // Left side - Customer info
        {
          stack: [
            { text: 'To', style: 'labelBold' },
            {
              stack: [
                { text: quotation.CustomerName || '', style: 'customerText', margin: [15, 0, 0, 0] },
                { text: quotation.CustomerAddress || '', style: 'customerText', margin: [15, 0, 0, 0] }
              ]
            }
          ],
          width: '50%'
        },
        // Right side - Quote details
        {
          stack: [
            {
              columns: [
                { text: `${docTypeLabel} No.`, style: 'labelBold', width: 90 },
                { text: `: ${quotation.QuoteNumber || ''}`, width: '*' }
              ]
            },
            {
              columns: [
                { text: `${docTypeLabel} Date`, style: 'labelBold', width: 90 },
                { text: `: ${this.formatDate(quotation.QuoteDate)}`, width: '*' }
              ]
            },
            {
              columns: [
                { text: 'Reference', style: 'labelBold', width: 90 },
                { text: `: ${quotation.CustomerRef || ''}`, width: '*' }
              ]
            }
          ],
          width: '50%',
          alignment: 'right'
        }
      ],
      margin: [0, 0, 0, 15]
    };
  }

  private buildGreeting(): any {
    return {
      stack: [
        { text: 'Dear Sir/Mam,', style: 'labelBold', margin: [0, 0, 0, 5] },
        {
          text: 'Thank you very much for the opportunity to quote for your esteemed organization.\nWe are pleased to submit our best rates as outlined below.',
          margin: [0, 0, 0, 15]
        }
      ]
    };
  }

  private buildRouteTables(data: QuotationPdfData): any[] {
    const content: any[] = [];
    const routes = data.routes || [];
    const showAgreedRate = data.quotation?.AgreedRate === 'Y';

    routes.forEach((route, index) => {
      const departmentName = this.getDepartmentName(route.DepartmentMasterSid, data.departments);
      const polPort = this.getFormattedPort(route.POLSid, data.ports);
      const podPort = this.getFormattedPort(route.PODSid, data.ports);
      const fdpPort = route.PODSid !== route.FDPSid ? this.getFormattedPort(route.FDPSid, data.ports) : '';

      const routeLabel = fdpPort ? `${polPort} - ${podPort} - ${fdpPort}` : `${polPort} - ${podPort}`;

      // Route header
      content.push({
        table: {
          widths: ['*'],
          body: [
            [{
              columns: [
                { text: departmentName || '', style: 'routeHeader' },
                { text: routeLabel, style: 'routeHeader', alignment: 'right' }
              ],
              fillColor: '#f5f5f5',
              margin: [5, 5, 5, 5]
            }]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 0,
          hLineColor: () => '#000000'
        },
        margin: [0, index > 0 ? 20 : 0, 0, 0]
      });

      // Process each carrier
      const carriers = route.quoteCarrier || [];
      carriers.forEach((carrier: any) => {
        const cargo = route.quoteCargo?.[0];

        // Carrier info row
        content.push({
          columns: [
            { text: [{ text: 'Carrier : ', bold: true }, carrier.CarrierName || ''], width: '25%' },
            { text: [{ text: 'Cargo Type : ', bold: true }, cargo?.CargoType || ''], width: '25%' },
            { text: [{ text: 'Valid From : ', bold: true }, this.formatDate(route.effDate)], width: '25%' },
            { text: [{ text: 'Valid To : ', bold: true }, this.formatDate(route.expdate)], width: '25%' }
          ],
          margin: [0, 8, 0, 8]
        });

        // Charges table
        const charges = carrier.quoteCharge || [];
        content.push(this.buildChargesTable(charges, showAgreedRate, data));
      });
    });

    return content;
  }

  private buildChargesTable(charges: any[], showAgreedRate: boolean, data: QuotationPdfData): any {
    // Build header row
    const headerRow: any[] = [
      { text: 'Charge', style: 'tableHeader' },
      { text: 'Unit', style: 'tableHeader' },
      { text: 'Qty', style: 'tableHeader', alignment: 'right' },
      { text: 'Curr', style: 'tableHeader' }
    ];

    if (showAgreedRate) {
      headerRow.push({ text: 'Ex Rate', style: 'tableHeader', alignment: 'right' });
    }

    headerRow.push(
      { text: 'Rate', style: 'tableHeader', alignment: 'right' },
      { text: 'Amt', style: 'tableHeader', alignment: 'right' }
    );

    if (showAgreedRate) {
      headerRow.push({ text: 'Local Amt', style: 'tableHeader', alignment: 'right' });
    }

    // Build data rows
    const dataRows: any[][] = charges.map((charge: any) => {
      const row: any[] = [
        { text: charge.ChargeDisplayName || '', style: 'tableCell' },
        { text: this.getChargeUOMCode(charge.RevenueChargeUomSid, data.chargeUnitMaster), style: 'tableCell' },
        { text: this.formatNumber(charge.Qty), style: 'tableCell', alignment: 'right' },
        { text: this.getCurrencyCode(charge.RevenueCurrencyMasterSid, data.currencyMaster), style: 'tableCell' }
      ];

      if (showAgreedRate) {
        row.push({ text: this.formatNumber(charge.RevenueExchangeRate, 3), style: 'tableCell', alignment: 'right' });
      }

      row.push(
        { text: this.formatNumber(charge.RevenueRate, 3), style: 'tableCell', alignment: 'right' },
        { text: this.formatNumber(charge.RevenueAmount, 3), style: 'tableCell', alignment: 'right' }
      );

      if (showAgreedRate) {
        row.push({ text: this.formatNumber(charge.RevenueLocalAmount, 3), style: 'tableCell', alignment: 'right' });
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
      layout: {
        hLineWidth: (i, node) => 1,
        vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 0 : 1,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 3,
        paddingBottom: () => 3
      },
      margin: [0, 0, 0, 15]
    };
  }

  private buildTermsSection(terms: any[]): any {
    if (!terms || terms.length === 0) {
      return { text: '' };
    }

    return {
      stack: [
        { text: 'Terms and Conditions', style: 'sectionTitle', margin: [0, 10, 0, 5] },
        {
          ul: terms.map(term => ({ text: term.TandC || '', margin: [0, 2, 0, 2] }))
        }
      ],
      margin: [0, 0, 0, 15]
    };
  }

  private buildClosingMessage(): any {
    return {
      text: 'We kindly look forward to your valuable support regarding the above shipment.',
      style: 'labelBold',
      margin: [0, 10, 0, 15]
    };
  }

  private buildSignature(data: QuotationPdfData): any {
    return {
      stack: [
        { text: 'Best Regards', style: 'labelBold', margin: [0, 0, 0, 8] },
        {
          columns: [
            { text: 'Name', style: 'labelBold', width: 60 },
            { text: `: ${data.userData?.userName || ''}`, width: '*' }
          ]
        },
        {
          columns: [
            { text: 'Company', style: 'labelBold', width: 60 },
            { text: `: ${data.company?.companyName || ''}`, width: '*' }
          ]
        }
      ]
    };
  }

  private buildFooter(data: QuotationPdfData, currentPage: number, pageCount: number): any {
    return {
      columns: [
        { text: `Printed By : ${data.userData?.userName || ''}`, fontSize: 8, alignment: 'left', width: '30%' },
        { text: 'This document is computer-generated and does not require a signature.', fontSize: 8, alignment: 'center', width: '40%' },
        { text: `Printed On : ${this.formatDate(new Date())}`, fontSize: 8, alignment: 'right', width: '30%' }
      ],
      margin: [40, 20, 40, 0]
    };
  }

  private getStyles(): any {
    return {
      companyName: {
        fontSize: 16,
        bold: true
      },
      branchName: {
        fontSize: 12,
        bold: true
      },
      addressText: {
        fontSize: 9
      },
      documentTitle: {
        fontSize: 18,
        bold: true
      },
      labelBold: {
        bold: true,
        fontSize: 10
      },
      customerText: {
        fontSize: 10
      },
      routeHeader: {
        bold: true,
        fontSize: 11
      },
      sectionTitle: {
        fontSize: 12,
        bold: true
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        fillColor: '#f0f0f0'
      },
      tableCell: {
        fontSize: 9
      }
    };
  }

  // Helper methods
  private formatDate(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatNumber(value: any, decimals: number = 0): string {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(decimals);
  }

  private getDepartmentName(deptId: number, departments: any[]): string {
    if (!deptId || !departments || departments.length === 0) return '';
    const dept = departments.find(d => d.DepartmentMasterSid === deptId);
    return dept?.departmentName || '';
  }

  private getFormattedPort(portId: number, ports: any[]): string {
    if (!portId || !ports || ports.length === 0) return '';
    const port = ports.find(p => p.PortMasterSid === portId);
    return port ? `${port.PortName} (${port.PortCode})` : '';
  }

  private getChargeUOMCode(uomId: number, chargeUnitMaster: any[]): string {
    if (!uomId || !chargeUnitMaster || chargeUnitMaster.length === 0) return '';
    const uom = chargeUnitMaster.find(u => u.UOMMasterSid === uomId);
    return uom?.UOMCode || '';
  }

  private getCurrencyCode(currencyId: number, currencyMaster: any[]): string {
    if (!currencyId || !currencyMaster || currencyMaster.length === 0) return '';
    const currency = currencyMaster.find(c => c.CurrencyMasterSid === currencyId);
    return currency?.currencyCode || '';
  }
}
