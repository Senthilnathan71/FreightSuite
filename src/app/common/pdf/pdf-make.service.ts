/**
 * PdfMakeService - Main facade service for PDF generation
 * Provides a unified API for generating all document types
 */

import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Configure pdfmake fonts
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

// Import interfaces
import {
  QuotationPdfData,
  EnquiryPdfData,
  BookingPdfData,
  CroPdfData,
  MasterJobPdfData,
  BookingDocumentType,
  MasterJobDocumentType,
  QuotationDocumentType,
  InvoicePdfData,
  JobCardPdfData,
  ShipmentReportPdfData,
  CargoArrivalPdfData,
  DeliveryOrderPdfData,
  CreditNotePdfData,
  ReceiptPdfData,
  PaymentPdfData
} from './interfaces/pdf-document.interfaces';

// Import generators
import { generateQuotationDocument, transformQuotationApiData } from './generators/quotation-pdf.generator';
import { generateEnquiryDocument, transformEnquiryApiData } from './generators/enquiry-pdf.generator';
import { generateBookingDocument, transformBookingApiData, transformCroApiData } from './generators/booking-pdf.generator';
import { generateMasterJobDocument, transformMasterJobApiData } from './generators/master-job-pdf.generator';
import { generateGenericReportDocument, GenericReportPdfData } from './generators/generic-report-pdf.generator';
import { ComplexReportExportConfig } from 'src/app/shared/excel-report-service';
import { generateInvoiceDocument, transformInvoiceApiData } from './generators/invoice-pdf.generator';
import {
  generateShipmentReportDocument,
  transformShipmentReportApiData
} from './generators/shipment-report-pdf.generator';
import {
  generateJobCardDocument,
  transformJobCardApiData
} from './generators/job-card-pdf.generator';
import {
  generateCargoArrivalDocument,
  transformCargoArrivalApiData
} from './generators/cargo-arrival-pdf.generator';
import {
  generateDeliveryOrderDocument,
  transformDeliveryOrderApiData
} from './generators/delivery-order-pdf.generator';
import { generateCreditNoteDocument, transformCreditNoteApiData } from './generators/credit-note-pdf.generator';
import { generateReceiptDocument, transformReceiptApiData } from './generators/receipt-pdf.generator';
import { generatePaymentDocument, transformPaymentApiData } from './generators/payment-pdf.generator';

@Injectable({ providedIn: 'root' })
export class PdfMakeService {

  // ==================== Core Methods ====================

  /**
   * Download PDF from document definition
   */
  download(docDefinition: any, filename: string): void {
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdfMake.createPdf(docDefinition).download(pdfFilename);
  }

  /**
   * Open PDF in new window for preview
   */
  open(docDefinition: any): void {
    pdfMake.createPdf(docDefinition).open();
  }

  /**
   * Print PDF directly
   */
  print(docDefinition: any): void {
    pdfMake.createPdf(docDefinition).print();
  }

  /**
   * Get PDF as Blob (for email attachments)
   */
  getBlob(docDefinition: any): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
          resolve(blob);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get PDF as Base64 string
   */
  getBase64(docDefinition: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).getBase64((base64: string) => {
          resolve(base64);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get PDF as data URL
   */
  getDataUrl(docDefinition: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).getDataUrl((dataUrl: string) => {
          resolve(dataUrl);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==================== Quotation ====================

  /**
   * Generate and download Quotation/Contract PDF
   */
  generateQuotation(data: QuotationPdfData, type: QuotationDocumentType = 'quotation'): void {
    const docDefinition = generateQuotationDocument(data, type);
    const docLabel = type === 'contract' ? 'Contract' : 'Quotation';
    const filename = `${docLabel}_${data.quotation?.quoteNumber || 'Draft'}.pdf`;
    this.download(docDefinition, filename);
  }

  /**
   * Get Quotation PDF as Blob
   */
  async generateQuotationBlob(data: QuotationPdfData, type: QuotationDocumentType = 'quotation'): Promise<Blob> {
    const docDefinition = generateQuotationDocument(data, type);
    return this.getBlob(docDefinition);
  }

  /**
   * Generate Quotation from raw API data
   */
  generateQuotationFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: any,
    type: QuotationDocumentType = 'quotation'
  ): void {
    const pdfData = transformQuotationApiData(apiData, company, branch, userData, logo, lookups);
    this.generateQuotation(pdfData, type);
  }

  /**
   * Get Quotation Blob from raw API data
   */
  async generateQuotationBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: any,
    type: QuotationDocumentType = 'quotation'
  ): Promise<Blob> {
    const pdfData = transformQuotationApiData(apiData, company, branch, userData, logo, lookups);
    return this.generateQuotationBlob(pdfData, type);
  }

  // ==================== Enquiry ====================

  /**
   * Generate and download Enquiry PDF
   */
  generateEnquiry(data: EnquiryPdfData): void {
    const docDefinition = generateEnquiryDocument(data);
    const filename = `Enquiry_${data.enquiry?.enquiryNumber || 'Draft'}.pdf`;
    this.download(docDefinition, filename);
  }

  /**
   * Get Enquiry PDF as Blob
   */
  async generateEnquiryBlob(data: EnquiryPdfData): Promise<Blob> {
    const docDefinition = generateEnquiryDocument(data);
    return this.getBlob(docDefinition);
  }

  /**
   * Generate Enquiry from raw API data
   */
  generateEnquiryFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: any
  ): void {
    const pdfData = transformEnquiryApiData(apiData, company, branch, userData, logo, lookups);
    this.generateEnquiry(pdfData);
  }

  /**
   * Get Enquiry Blob from raw API data
   */
  async generateEnquiryBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: any
  ): Promise<Blob> {
    const pdfData = transformEnquiryApiData(apiData, company, branch, userData, logo, lookups);
    return this.generateEnquiryBlob(pdfData);
  }

  // ==================== Booking ====================

  /**
   * Generate and download Booking PDF
   */
  generateBooking(data: BookingPdfData, type: BookingDocumentType = 'booking'): void {
    const docDefinition = generateBookingDocument(data, type);
    const docLabel = type === 'cro' ? 'CRO' : 'Booking';
    const filename = `${docLabel}_${data.booking?.bookingNo || 'Draft'}.pdf`;
    this.download(docDefinition, filename);
  }

  /**
   * Get Booking PDF as Blob
   */
  async generateBookingBlob(data: BookingPdfData, type: BookingDocumentType = 'booking'): Promise<Blob> {
    const docDefinition = generateBookingDocument(data, type);
    return this.getBlob(docDefinition);
  }

  /**
   * Generate Booking from raw API data
   */
  generateBookingFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: any,
    type: BookingDocumentType = 'booking'
  ): void {
    const pdfData = type === 'cro'
      ? transformCroApiData(apiData, company, branch, userData, logo) as any
      : transformBookingApiData(apiData, company, branch, userData, logo, lookups);
    this.generateBooking(pdfData, type);
  }

  /**
   * Get Booking Blob from raw API data
   */
  async generateBookingBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: any,
    type: BookingDocumentType = 'booking'
  ): Promise<Blob> {
    const pdfData = type === 'cro'
      ? transformCroApiData(apiData, company, branch, userData, logo) as any
      : transformBookingApiData(apiData, company, branch, userData, logo, lookups);
    return this.generateBookingBlob(pdfData, type);
  }

  // ==================== Master Job ====================

  /**
   * Generate and download Master Job PDF
   */
  generateMasterJob(data: MasterJobPdfData, type: MasterJobDocumentType = 'mbl'): void {
    const docDefinition = generateMasterJobDocument(data, type);
    const typeLabels: Record<MasterJobDocumentType, string> = {
      mbl: 'MBL',
      manifest: 'Manifest',
      jobCard: 'JobCard',
      packingList: 'PackingList'
    };
    const docLabel = typeLabels[type] || 'Document';
    const filename = `${docLabel}_${data.masterJob?.jobNo || data.masterJob?.mblNo || 'Draft'}.pdf`;
    this.download(docDefinition, filename);
  }

  /**
   * Get Master Job PDF as Blob
   */
  async generateMasterJobBlob(data: MasterJobPdfData, type: MasterJobDocumentType = 'mbl'): Promise<Blob> {
    const docDefinition = generateMasterJobDocument(data, type);
    return this.getBlob(docDefinition);
  }

  /**
   * Generate Master Job from raw API data
   */
  generateMasterJobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: any,
    type: MasterJobDocumentType = 'mbl'
  ): void {
    const pdfData = transformMasterJobApiData(apiData, company, branch, userData, logo, lookups);
    this.generateMasterJob(pdfData, type);
  }

  /**
   * Get Master Job Blob from raw API data
   */
  async generateMasterJobBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: any,
    type: MasterJobDocumentType = 'mbl'
  ): Promise<Blob> {
    const pdfData = transformMasterJobApiData(apiData, company, branch, userData, logo, lookups);
    return this.generateMasterJobBlob(pdfData, type);
  }

  // ==================== Generic Report ====================

  /**
   * Generate and download a generic report PDF from ComplexReportExportConfig
   */
  generateGenericReport(
    exportConfig: ComplexReportExportConfig,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    orientation?: 'portrait' | 'landscape'
  ): void {
    const data = this.buildGenericReportData(exportConfig, company, branch, userData, logo, orientation);
    const docDefinition = generateGenericReportDocument(data);
    this.download(docDefinition, exportConfig.fileName || 'Report');
  }

  /**
   * Get generic report PDF as Blob (for email attachments)
   */
  async generateGenericReportBlob(
    exportConfig: ComplexReportExportConfig,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    orientation?: 'portrait' | 'landscape'
  ): Promise<Blob> {
    const data = this.buildGenericReportData(exportConfig, company, branch, userData, logo, orientation);
    const docDefinition = generateGenericReportDocument(data);
    return this.getBlob(docDefinition);
  }

  /**
   * Build GenericReportPdfData from raw inputs
   */
  private buildGenericReportData(
    exportConfig: ComplexReportExportConfig,
    company: any, branch: any, userData: any,
    logo?: string, orientation?: 'portrait' | 'landscape'
  ): GenericReportPdfData {
    console.log(company, branch, logo)
    return {
      exportConfig,
      company: {
        companyName: company?.CompanyName || company?.companyName || '',
        addressLine1: company?.Address || company?.addressLine1 || '',
        phoneNumber: company?.Phone || company?.phoneNumber || '',
        email: company?.Email || company?.email || ''
      },
      branch: {
        branchName: branch?.BranchName || branch?.branchName || '',
        addressLine1: branch?.Address || branch?.addressLine1 || '',
        addressLine2: branch?.addressLine2 || '',
        cityName: branch?.cityMaster?.cityName || branch?.cityName || '',
        postalCode: branch?.postalCode || '',
        phoneNumber: branch?.phoneNumber || '',
        cityMaster: branch?.cityMaster
      },
      userData: {
        userName: userData?.UserName || userData?.userName || ''
      },
      logo,
      orientation
    };
  }

   /**
   * Generate and download Invoice PDF
   */
  generateInvoice(data: InvoicePdfData): void {
    const docDefinition = generateInvoiceDocument(data);
    const filename = `Invoice_${data.invoice?.invoiceNo || 'Draft'}.pdf`;
    this.download(docDefinition, filename);
  }

  /**
   * Get Invoice PDF as Blob
   */
  async generateInvoiceBlob(data: InvoicePdfData): Promise<Blob> {
    try {
      const docDefinition = generateInvoiceDocument(data);
      return this.getBlob(docDefinition);
    } catch (error) {
      console.error('Invoice PDF Generation Error:', error);
      throw error;
    }
  }

  /**
   * Open Invoice PDF in new window for preview
   */
  openInvoice(data: InvoicePdfData): void {
    const docDefinition = generateInvoiceDocument(data);
    this.open(docDefinition);
  }

  /**
   * Generate Invoice from raw API data
   */
  generateInvoiceFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: {
      hssacMaster?: any[];
      currencyMaster?: any[];
    },
    options?: {
      taxDisplayConfig?: {
        showCGST: boolean;
        showSGST: boolean;
        showIGST: boolean;
        showVAT: boolean;
      };
      bankDetails?: any[];
      terms?: any[];
      amountInWords?: string;
      localCurrency?: string;
      invoiceTitle?: string;
    }
  ): void {
    const pdfData = transformInvoiceApiData(apiData, company, branch, userData, logo, lookups, options);
    this.generateInvoice(pdfData);
  }

  /**
   * Get Invoice Blob from raw API data
   */
  async generateInvoiceBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: {
      hssacMaster?: any[];
      currencyMaster?: any[];
    },
    options?: {
      taxDisplayConfig?: {
        showCGST: boolean;
        showSGST: boolean;
        showIGST: boolean;
        showVAT: boolean;
      };
      bankDetails?: any[];
      terms?: any[];
      amountInWords?: string;
      localCurrency?: string;
      invoiceTitle?: string;
    }
  ): Promise<Blob> {
    const pdfData = transformInvoiceApiData(apiData, company, branch, userData, logo, lookups, options);
    return this.generateInvoiceBlob(pdfData);
  }

  // ==================== Shipment Report ====================

  generateShipmentReport(data: ShipmentReportPdfData): void {
    const docDefinition = generateShipmentReportDocument(data);
    const filename = `Shipment_${data.shipmentNo || 'Report'}.pdf`;
    this.download(docDefinition, filename);
  }

  async generateShipmentReportBlob(data: ShipmentReportPdfData): Promise<Blob> {
    const docDefinition = generateShipmentReportDocument(data);
    return this.getBlob(docDefinition);
  }

  generateShipmentReportFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      chargeList?: any[];
      profitSummary?: any[];
      customerWiseSummary?: { revenue?: any[]; cost?: any[] };
      containerTypeList?: any[];
      selectedFCLLCL?: string;
      portList?: any[];
    }
  ): void {
    const pdfData = transformShipmentReportApiData(apiData, company, branch, userData, logo, options);
    this.generateShipmentReport(pdfData);
  }

  async generateShipmentReportBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      chargeList?: any[];
      profitSummary?: any[];
      customerWiseSummary?: { revenue?: any[]; cost?: any[] };
      containerTypeList?: any[];
      selectedFCLLCL?: string;
      portList?: any[];
    }
  ): Promise<Blob> {
    const pdfData = transformShipmentReportApiData(apiData, company, branch, userData, logo, options);
    return this.generateShipmentReportBlob(pdfData);
  }

  // ==================== Job Card ====================

  generateJobCard(data: JobCardPdfData): void {
    const docDefinition = generateJobCardDocument(data);
    const filename = `Job_Card_${data.jobInfo?.jobNo || 'Report'}.pdf`;
    this.download(docDefinition, filename);
  }

  async generateJobCardBlob(data: JobCardPdfData): Promise<Blob> {
    const docDefinition = generateJobCardDocument(data);
    return this.getBlob(docDefinition);
  }

  generateJobCardFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      containerTypeList?: any[];
      currencyList?: any[];
      chargeList?: any[];
      profitSummary?: any[];
      salesmenList?: any[];
      uomList?: any[];
      portList?: any[];
      selectedDepartmentType?: string;
    }
  ): void {
    const pdfData = transformJobCardApiData(apiData, company, branch, userData, logo, options);
    this.generateJobCard(pdfData);
  }

  async generateJobCardBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      containerTypeList?: any[];
      currencyList?: any[];
      chargeList?: any[];
      profitSummary?: any[];
      salesmenList?: any[];
      uomList?: any[];
      portList?: any[];
      selectedDepartmentType?: string;
    }
  ): Promise<Blob> {
    const pdfData = transformJobCardApiData(apiData, company, branch, userData, logo, options);
    return this.generateJobCardBlob(pdfData);
  }

  // ==================== Cargo Arrival ====================

  generateCargoArrival(data: CargoArrivalPdfData): void {
    const docDefinition = generateCargoArrivalDocument(data);
    const filename = `Cargo_Arrival_${data.referenceInfo?.hblNo || data.referenceInfo?.bookingNo || 'Report'}.pdf`;
    this.download(docDefinition, filename);
  }

  async generateCargoArrivalBlob(data: CargoArrivalPdfData): Promise<Blob> {
    const docDefinition = generateCargoArrivalDocument(data);
    return this.getBlob(docDefinition);
  }

  generateCargoArrivalFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      masterJobContainers?: any[];
      withOrWithoutCharge?: boolean;
      selectedFCLLCL?: string;
      currencyList?: any[];
      uomList?: any[];
      containerTypeList?: any[];
      packageTypeList?: any[];
      portList?: any[];
      amountInWords?: string;
    }
  ): void {
    const pdfData = transformCargoArrivalApiData(apiData, company, branch, userData, logo, options);
    this.generateCargoArrival(pdfData);
  }

  async generateCargoArrivalBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      masterJobContainers?: any[];
      withOrWithoutCharge?: boolean;
      selectedFCLLCL?: string;
      currencyList?: any[];
      uomList?: any[];
      containerTypeList?: any[];
      packageTypeList?: any[];
      portList?: any[];
      amountInWords?: string;
    }
  ): Promise<Blob> {
    const pdfData = transformCargoArrivalApiData(apiData, company, branch, userData, logo, options);
    return this.generateCargoArrivalBlob(pdfData);
  }

  // ==================== Delivery Order ====================

  generateDeliveryOrder(data: DeliveryOrderPdfData): void {
    const docDefinition = generateDeliveryOrderDocument(data);
    const filename = `Delivery_Order_${data.referenceInfo?.shipmentNo || data.referenceInfo?.hblNo || 'Report'}.pdf`;
    this.download(docDefinition, filename);
  }

  async generateDeliveryOrderBlob(data: DeliveryOrderPdfData): Promise<Blob> {
    const docDefinition = generateDeliveryOrderDocument(data);
    return this.getBlob(docDefinition);
  }

  generateDeliveryOrderFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      masterJobContainers?: any[];
      selectedFCLLCL?: string;
      currencyList?: any[];
      uomList?: any[];
      containerTypeList?: any[];
      packageTypeList?: any[];
      terms?: any[];
      amountInWords?: string;
    }
  ): void {
    const pdfData = transformDeliveryOrderApiData(apiData, company, branch, userData, logo, options);
    this.generateDeliveryOrder(pdfData);
  }

  async generateDeliveryOrderBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      masterJobContainers?: any[];
      selectedFCLLCL?: string;
      currencyList?: any[];
      uomList?: any[];
      containerTypeList?: any[];
      packageTypeList?: any[];
      terms?: any[];
      amountInWords?: string;
    }
  ): Promise<Blob> {
    const pdfData = transformDeliveryOrderApiData(apiData, company, branch, userData, logo, options);
    return this.generateDeliveryOrderBlob(pdfData);
  }


  // ==================== Credit Note ====================

  generateCreditNote(data: CreditNotePdfData): void {
    const docDefinition = generateCreditNoteDocument(data);
    const filename = `Credit_Note_${data.credit?.invoiceNo}.pdf`;
    this.download(docDefinition, filename);
  }

    /**
   * Get Invoice PDF as Blob
   */
  async generateCreditNoteBlob(data: CreditNotePdfData): Promise<Blob> {
    try {
      const docDefinition = generateCreditNoteDocument(data);
      return this.getBlob(docDefinition);
    } catch (error) {
      console.error('Credit Note PDF Generation Error:', error);
      throw error;
    }
  }

   /**
   * Open Invoice PDF in new window for preview
   */
  openCreditNote(data: CreditNotePdfData): void {
    const docDefinition = generateCreditNoteDocument(data);
    this.open(docDefinition);
  }

  /**
   * Generate creditnote from raw API data
   */
  generateCreditNoteFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: {
      hssacMaster?: any[];
      currencyMaster?: any[];
    },
    options?: {
      taxDisplayConfig?: {
        showCGST: boolean;
        showSGST: boolean;
        showIGST: boolean;
        showVAT: boolean;
      };
      bankDetails?: any[];
      terms?: any[];
      amountInWords?: string;
      localCurrency?: string;
      invoiceTitle?: string;
    }
  ): void {
    const pdfData = transformCreditNoteApiData(apiData, company, branch, userData, logo, lookups, options);
    this.generateCreditNote(pdfData);
  }

    /**
   * Get Invoice Blob from raw API data
   */
  async generateCreditNoteBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    lookups?: {
      hssacMaster?: any[];
      currencyMaster?: any[];
    },
    options?: {
      taxDisplayConfig?: {
        showCGST: boolean;
        showSGST: boolean;
        showIGST: boolean;
        showVAT: boolean;
      };
      bankDetails?: any[];
      terms?: any[];
      amountInWords?: string;
      localCurrency?: string;
      invoiceTitle?: string;
    }
  ): Promise<Blob> {
    const pdfData = transformCreditNoteApiData(apiData, company, branch, userData, logo, lookups, options);
    return this.generateCreditNoteBlob(pdfData);
  }

  // ==================== Receipt ====================

  generateReceipt(data: ReceiptPdfData): void {
    const docDefinition = generateReceiptDocument(data);
    const prefix = data.receiptType === 'bank' ? 'Bank_Receipt' : 'Cash_Receipt';
    const filename = `${prefix}_${data.receipt?.voucherNumber || 'Draft'}.pdf`;
    this.download(docDefinition, filename);
  }

  async generateReceiptBlob(data: ReceiptPdfData): Promise<Blob> {
    try {
      const docDefinition = generateReceiptDocument(data);
      return this.getBlob(docDefinition);
    } catch (error) {
      console.error('Receipt PDF Generation Error:', error);
      throw error;
    }
  }

  generateReceiptFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      receiptType?: 'bank' | 'cash';
      coaList?: any[];
      bankTypedLedgers?: any[];
      amountInWords?: string;
      currentUserCountry?: string;
      printSettings?: {
        logoPosition: 'left' | 'center' | 'right';
        companyPosition: 'left' | 'center' | 'right';
        companyAlignment: 'left' | 'center' | 'right';
      };
    }
  ): void {
    const pdfData = transformReceiptApiData(apiData, company, branch, userData, logo, options);
    this.generateReceipt(pdfData);
  }

  async generateReceiptBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      receiptType?: 'bank' | 'cash';
      coaList?: any[];
      bankTypedLedgers?: any[];
      amountInWords?: string;
      currentUserCountry?: string;
      printSettings?: {
        logoPosition: 'left' | 'center' | 'right';
        companyPosition: 'left' | 'center' | 'right';
        companyAlignment: 'left' | 'center' | 'right';
      };
    }
  ): Promise<Blob> {
    const pdfData = transformReceiptApiData(apiData, company, branch, userData, logo, options);
    return this.generateReceiptBlob(pdfData);
  }

  // ==================== Payment ====================

  generatePayment(data: PaymentPdfData): void {
    const docDefinition = generatePaymentDocument(data);
    const prefix = data.paymentType === 'bank' ? 'Bank_Payment' : 'Cash_Payment';
    const filename = `${prefix}_${data.payment?.voucherNumber || 'Draft'}.pdf`;
    this.download(docDefinition, filename);
  }

  async generatePaymentBlob(data: PaymentPdfData): Promise<Blob> {
    try {
      const docDefinition = generatePaymentDocument(data);
      return this.getBlob(docDefinition);
    } catch (error) {
      console.error('Payment PDF Generation Error:', error);
      throw error;
    }
  }

  generatePaymentFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      paymentType?: 'bank' | 'cash';
      coaList?: any[];
      ledgerList?: any[];
      bankTypedLedgers?: any[];
      amountInWords?: string;
      printSettings?: {
        logoPosition: 'left' | 'center' | 'right';
        companyPosition: 'left' | 'center' | 'right';
        companyAlignment: 'left' | 'center' | 'right';
      };
    }
  ): void {
    const pdfData = transformPaymentApiData(apiData, company, branch, userData, logo, options);
    this.generatePayment(pdfData);
  }

  async generatePaymentBlobFromApi(
    apiData: any,
    company: any,
    branch: any,
    userData: any,
    logo?: string,
    options?: {
      paymentType?: 'bank' | 'cash';
      coaList?: any[];
      ledgerList?: any[];
      bankTypedLedgers?: any[];
      amountInWords?: string;
      printSettings?: {
        logoPosition: 'left' | 'center' | 'right';
        companyPosition: 'left' | 'center' | 'right';
        companyAlignment: 'left' | 'center' | 'right';
      };
    }
  ): Promise<Blob> {
    const pdfData = transformPaymentApiData(apiData, company, branch, userData, logo, options);
    return this.generatePaymentBlob(pdfData);
  }


  // ==================== Utility Methods ====================

  /**
   * Get current report logo from localStorage
   */
  getReportLogo(): string | undefined {
    return localStorage.getItem('current_report_logo') || undefined;
  }

  /**
   * Preview document definition (for debugging)
   */
  previewDocDefinition(docDefinition: any): void {
    console.log('PDF Document Definition:', JSON.stringify(docDefinition, null, 2));
  }
}
