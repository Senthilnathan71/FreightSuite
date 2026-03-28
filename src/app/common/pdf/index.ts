/**
 * PDF Module Public API
 * Export all public interfaces, services, and utilities
 */

// Main Service
export { PdfMakeService } from './pdf-make.service';

// Interfaces
export * from './interfaces/pdf-base.interface';
export * from './interfaces/pdf-document.interfaces';

// Generators (for advanced usage)
export { generateQuotationDocument, transformQuotationApiData } from './generators/quotation-pdf.generator';
export { generateEnquiryDocument, transformEnquiryApiData } from './generators/enquiry-pdf.generator';
export { generateBookingDocument, transformBookingApiData, transformCroApiData } from './generators/booking-pdf.generator';
export { generateMasterJobDocument, transformMasterJobApiData } from './generators/master-job-pdf.generator';
export { generateGenericReportDocument, GenericReportPdfData } from './generators/generic-report-pdf.generator';
export { generateReceiptDocument, transformReceiptApiData } from './generators/receipt-pdf.generator';
export { generatePaymentDocument, transformPaymentApiData } from './generators/payment-pdf.generator';
export { generateJournalVoucherDocument, transformJournalVoucherApiData } from './generators/journal-voucher-pdf.generator';
export { generateReleaseLetterDocument, transformReleaseLetterApiData } from './generators/release-letter-pdf.generator';

// Builders (for custom PDF creation)
export * from './builders/pdf-header.builder';
export * from './builders/pdf-footer.builder';
export * from './builders/pdf-table.builder';
export * from './builders/pdf-section.builder';

// Helpers
export * from './helpers/pdf-formatters';

// Styles
export * from './styles/pdf-styles';
