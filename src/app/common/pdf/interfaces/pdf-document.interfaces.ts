/**
 * Document-specific interfaces for PDF generation
 */

import {
  PdfDocumentBase,
  PdfChargeItem,
  PdfCargoItem,
  PdfRouteInfo,
  PdfTermItem,
  PdfProductItem,
  PdfContainerItem,
  PdfPortInfo
} from './pdf-base.interface';

// =====================
// QUOTATION PDF DATA
// =====================
export interface QuotationPdfData extends PdfDocumentBase {
  quotation: {
    quoteNumber?: string;
    quoteDate?: Date | string;
    customerRef?: string;
    customerName?: string;
    customerAddress?: string;
    isContract?: boolean;
    agreedRate?: boolean;
    validFrom?: Date | string;
    validTo?: Date | string;
  };
  routes: QuotationRouteData[];
  terms: PdfTermItem[];
  currencyMaster?: any[];
  chargeUnitMaster?: any[];
  departments?: any[];
  ports?: any[];
}

export interface QuotationRouteData {
  departmentSid?: number;
  departmentName?: string;
  polSid?: number;
  podSid?: number;
  fdpSid?: number;
  effDate?: Date | string;
  expDate?: Date | string;
  carriers: QuotationCarrierData[];
  cargo?: PdfCargoItem[];
}

export interface QuotationCarrierData {
  carrierName?: string;
  charges: PdfChargeItem[];
}

// =====================
// ENQUIRY PDF DATA
// =====================
export interface EnquiryPdfData extends PdfDocumentBase {
  enquiry: {
    enquiryNumber?: string;
    enquiryDate?: Date | string;
    customerName?: string;
    customerAddress?: string;
    contactPerson?: string;
    contactNumber?: string;
    email?: string;
    salesmanName?: string;
    enquiryType?: string;
    shipmentDate?: Date | string;
    incoTerms?: string;
    freightTerms?: string;
    remarks?: string;
    shipmentType?: string;
    clearanceBy?: string;
    transportBy?: string;
    customerRef?: string;
    createdBy?: string;
    createdOn?: Date | string;
    shipperName?: string;
    shipperAddress?: string;
    consigneeName?: string;
    consigneeAddress?: string;
    pickupAddress?: string;
    additionalService?: string;
    modeOfBl?: string;
    shipmentFreq?: string;
  };
  routes: EnquiryRouteData[];
  fclLcl: 'FCL' | 'LCL' | 'AIR';
  departmentName?: string;
}

export interface EnquiryRouteData {
  poo?: PdfPortInfo;
  pol?: PdfPortInfo;
  pod?: PdfPortInfo;
  fpd?: PdfPortInfo;
  cargo: EnquiryCargoData[];
}

export interface EnquiryCargoData extends PdfCargoItem {
  packageQty?: number;
  weightUnit?: string;
  cargoDescription?: string;
  productName?: string;
}

// =====================
// BOOKING PDF DATA
// =====================
export interface BookingPdfData extends PdfDocumentBase {
  booking: {
    bookingNo?: string;
    bookingDate?: Date | string;
    cutOffDate?: Date | string;
    customerName?: string;
    customerAddress?: string;
    shipperName?: string;
    shipperAddress?: string;
    consigneeName?: string;
    consigneeAddress?: string;
    vesselName?: string;
    voyageNo?: string;
    carrierName?: string;
    carrierBookingRef?: string;
    hblNo?: string;
    mblNo?: string;
    quotationNumber?: string;
    polEta?: Date | string;
    polEtd?: Date | string;
    podEta?: Date | string;
    fpdEta?: Date | string;
    incoTerms?: string;
    freightTerms?: string;
    handOverTo?: string;
    destinationAgent?: string;
    remarks?: string;
  };
  route: {
    pol?: PdfPortInfo;
    pod?: PdfPortInfo;
    fpd?: PdfPortInfo;
  };
  cargo: BookingCargoData[];
  products: BookingProductData[];
  terms?: PdfTermItem[];
  fclLcl: 'FCL' | 'LCL' | 'AIR';
  departmentName?: string;
}

export interface BookingCargoData extends PdfCargoItem {
  shipmentTerms?: string;
}

export interface BookingProductData extends PdfProductItem {
  shippingBillNo?: string;
  shippingBillDate?: Date | string;
}

// =====================
// CRO (Container Release Order) PDF DATA
// =====================
export interface CroPdfData extends PdfDocumentBase {
  cro: {
    croNumber?: string;
    releaseOrderDate?: Date | string;
    bookingNo?: string;
    customerName?: string;
    customerAddress?: string;
    vesselName?: string;
    voyageNo?: string;
    pol?: PdfPortInfo;
    pod?: PdfPortInfo;
    transporter?: string;
    transporterAddress?: string;
    emptyYard?: string;
    emptyYardAddress?: string;
    validityDate?: Date | string;
    remarks?: string;
  };
  containers: CroContainerData[];
  fclLcl: 'FCL' | 'LCL' | 'AIR';
  departmentName?: string;
}

export interface CroContainerData {
  containerType: string;
  quantity: number;
  size?: string;
}

// =====================
// SAILING CONFIRMATION PDF DATA
// =====================
export interface SailingConfirmationPdfData extends PdfDocumentBase {
  sailing: {
    mblNo?: string;
    hblNo?: string;
    eta?: Date | string;
    etd?: Date | string;
    containerList?: string[];
    shipmentNo?: string;
    placeOfReceipt?: string;
    portOfLoading?: string;
    finalDestination?: string;
    carrier?: string;
    freightTerms?: string;
    vesselName?: string;
    voyageNo?: string;
    jobNo?: string;
    portOfReceipt?: string;
    portOfDischarge?: string;
    placeOfDelivery?: string;
    movementType?: string;
    masterJobNumber?: string;
  };
}

// =====================
// PACKING LIST PDF DATA
// =====================
export interface PackingListPdfData extends PdfDocumentBase {
  selectedFclLcl?: string;
  terms?: string[];
  packing: {
    shipperName?: string;
    shipperAddress?: string;
    clientName?: string;
    clientAddress?: string;
    consigneeName?: string;
    consigneeAddress?: string;
    shipmentNo?: string;
    jobNo?: string;
    mblNo?: string;
    hblNo?: string;
    placeOfReceipt?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    placeOfDelivery?: string;
    finalDestination?: string;
    eta?: Date | string;
    etd?: Date | string;
    vesselVoyage?: string;
    carrier?: string;
    movementType?: string;
    freightTerms?: string;
    remarks?: string;
  };
  products: Array<{
    productName?: string;
    length?: number | string;
    width?: number | string;
    height?: number | string;
    packageType?: string;
    packageQty?: number;
    grossWeight?: number;
    volume?: number;
  }>;
}

// =====================
// COMMERCIAL INVOICE PDF DATA
// =====================
export interface CommercialInvoicePdfData extends PdfDocumentBase {
  invoice: {
    hblNo?: string;
    jobNo?: string;
    toName?: string;
    toAddress?: string;
    shipperName?: string;
    shipperAddress?: string;
    consigneeName?: string;
    consigneeAddress?: string;
    notifyName?: string;
    notifyAddress?: string;
    commodityDescription?: string;
    currency?: string;
    noOfPackage?: number;
    grossWeight?: number;
    netWeight?: number;
    volume?: number;
    goodsValue?: number;
    totalValue?: string;
  };
  products: Array<{
    commodity?: string;
    containerNo?: string;
    containerType?: string;
    packageQty?: number;
    grossWeight?: number;
    netWeight?: number;
    volume?: number;
  }>;
  totals: {
    totalPkg: number;
    totalGrossWeight: number;
    totalNetWeight: number;
    totalVolume: number;
  };
}

// =====================
// MASTER JOB PDF DATA
// =====================
export interface MasterJobPdfData extends PdfDocumentBase {
  masterJob: {
    jobNo?: string;
    mblNo?: string;
    jobDate?: Date | string;
    vesselName?: string;
    voyageNo?: string;
    carrierName?: string;
    pol?: PdfPortInfo;
    pod?: PdfPortInfo;
    fpd?: PdfPortInfo;
    polEtd?: Date | string;
    podEta?: Date | string;
    shipper?: PartyInfo;
    consignee?: PartyInfo;
    notifyParty?: PartyInfo;
    agent?: PartyInfo;
    freightTerms?: string;
    incoTerms?: string;
    placeOfReceipt?: string;
    placeOfDelivery?: string;
    remarks?: string;
    marksAndNumbers?: string;
    descriptionOfGoods?: string;
  };
  containers: PdfContainerItem[];
  houseJobs?: HouseJobSummary[];
  charges?: PdfChargeItem[];
  fclLcl: 'FCL' | 'LCL' | 'AIR';
  departmentName?: string;
}

export interface PartyInfo {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface HouseJobSummary {
  hblNo?: string;
  shipperName?: string;
  consigneeName?: string;
  packages?: number;
  grossWeight?: number;
  volume?: number;
  description?: string;
}

// =====================
// INVOICE PDF DATA
// =====================
export interface InvoicePdfData extends PdfDocumentBase {
  invoice: {
    invoiceNo?: string;
    invoiceDate?: Date | string;
    dueDate?: Date | string;
    customerName?: string;
    customerAddress?: string;
    customerGstVat?: string;
    jobNo?: string;
    hblNo?: string;
    mblNo?: string;
    bookingNo?: string;
    vesselVoyage?: string;
    pol?: string;
    pod?: string;
    fpd?: string;
    placeOfSupply?: string;
    exchangeRate?: number;
    currencyCode?: string;
    postStatus?: 'P' | 'U';
    remarks?: string;
    salesPerson?: string;
    shipperName?: string;
    consigneeName?: string;
    freightTerms?: string;
    pkgWtVol?: string;
    etd?: string;
    eta?: string;
    containerType?: string;
    containerNumber?: string;
    customerRefNo?: string;
    irnNumber?: string;
    // Additional fields for matching original PDF
    shipperRefNo?: string;
    loadingPort?: string;
    finalDestination?: string;
    invoiceDueDate?: Date | string;
    vesselName?: string;
    voyageNo?: string;
    flightName?: string;
    flightNo?: string;
  };
  charges: InvoiceChargeData[];
  totals: {
    subTotal: number;
    taxAmount: number;
    grandTotal: number;
    currency: string;
  };
  bankDetails?: InvoiceBankDetail[];
  terms?: PdfTermItem[];
  amountInWords?: string;
  localCurrency?: string;
  taxDisplayConfig?: {
    showCGST: boolean;
    showSGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  };
  invoiceTitle?: string;
  companyGstCode?: string;
  companyPan?: string;
  // Additional fields for matching original PDF
  companyVatNo?: string;
  isSeaMode?: boolean;
  isVATMode?: boolean;
  authorisedSignatory?: boolean;
  cargoDetails?: {
    packages?: number | string;
    commodityDesc?: string;
    grossWeight?: number | string;
    chargeableWeight?: number | string;
    cbm?: number | string;
  };
}

export interface InvoiceBankDetail {
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  swiftCode?: string;
  branchName?: string;
  // Additional fields for matching original PDF
  iban?: string;
  bankAddress?: string;
  beneficiaryName?: string;
}
export interface InvoiceChargeData extends PdfChargeItem {
  sno?: number;
  hsnSacCode?: string;
  drCr?: 'D' | 'C';
  taxableAmount?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  igstPercent?: number;
  igstAmount?: number;
  vatPercent?: number;
  vatAmount?: number;
  partyAmount?: number;
  // Additional fields for matching original PDF
  currencyCode?: string;
  roe?: number;
}



// =====================
// CREDIT NOTE PDF DATA
// =====================

export interface CreditNotePdfData extends PdfDocumentBase {
   credit: {
    invoiceNo?: string;
    invoiceDate?: Date | string;
    dueDate?: Date | string;
    customerName?: string;
    customerAddress?: string;
    customerGstVat?: string;
    jobNo?: string;
    hblNo?: string;
    mblNo?: string;
    bookingNo?: string;
    vesselVoyage?: string;
    pol?: string;
    pod?: string;
    fpd?: string;
    placeOfSupply?: string;
    exchangeRate?: number;
    currencyCode?: string;
    postStatus?: 'P' | 'U';
    remarks?: string;
    salesPerson?: string;
    shipperName?: string;
    consigneeName?: string;
    freightTerms?: string;
    pkgWtVol?: string;
    etd?: string;
    eta?: string;
    containerType?: string;
    containerNumber?: string;
    customerRefNo?: string;
    irnNumber?: string;
    // Additional fields for matching original PDF
    shipperRefNo?: string;
    loadingPort?: string;
    finalDestination?: string;
    invoiceDueDate?: Date | string;
    vesselName?: string;
    voyageNo?: string;
    flightName?: string;
    flightNo?: string;
  }; 
  
  charges: CreditChargeData[];
   totals: {
    subTotal: number;
    taxAmount: number;
    grandTotal: number;
    currency: string;
  };

  bankDetails?: CreditBankDetail[];
    terms?: PdfTermItem[];
    amountInWords?: string;
    localCurrency?: string;
  taxDisplayConfig?: {
    showCGST: boolean;
    showSGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  };
   creditnoteTitle?: string;
  companyGstCode?: string;
  companyPan?: string;
  // Additional fields for matching original PDF
  companyVatNo?: string;
  isSeaMode?: boolean;
  isVATMode?: boolean;
  authorisedSignatory?: boolean;

  cargoDetails?: {
    packages?: number | string;
    commodityDesc?: string;
    grossWeight?: number | string;
    chargeableWeight?: number | string;
    cbm?: number | string;
  };
}

export interface CreditBankDetail {
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  swiftCode?: string;
  branchName?: string;
  // Additional fields for matching original PDF
  iban?: string;
  bankAddress?: string;
  beneficiaryName?: string;
}

export interface CreditChargeData extends PdfChargeItem {
  sno?: number;
  hsnSacCode?: string;
  drCr?: 'D' | 'C';
  taxableAmount?: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  igstPercent?: number;
  igstAmount?: number;
  vatPercent?: number;
  vatAmount?: number;
  partyAmount?: number;
  // Additional fields for matching original PDF
  currencyCode?: string;
  roe?: number;
}

// =====================
// RECEIPT PDF DATA
// =====================
export interface ReceiptPdfData extends PdfDocumentBase {
  printSettings?: {
    logoPosition: 'left' | 'center' | 'right';
    companyPosition: 'left' | 'center' | 'right';
    companyAlignment: 'left' | 'center' | 'right';
  };
  receiptType: 'bank' | 'cash';
  receipt: {
    voucherNumber?: string;
    voucherDate?: Date | string;
    partyName?: string;
    currencyCode?: string;
    exchangeRate?: number;
    bankName?: string;
    instrumentMode?: string;
    instrumentNumber?: string;
    instrumentDate?: Date | string;
  };
  details: ReceiptLineData[];
  voucherMatchings?: ReceiptMatchingData[];
  totals: {
    totalAmount: number;
    totalMatchingAmount: number;
    totalMatchingLocalAmount: number;
  };
  amountInWords?: string;
  currentUserCountry?: string;
}

export interface ReceiptLineData {
  ledgerName?: string;
  narration?: string;
  currencyCode?: string;
  exchangeRate?: number;
  amount?: number;
  partyAmount?: number;
}

export interface ReceiptMatchingData {
  voucherNumber?: string;
  voucherType?: string;
  voucherDate?: Date | string;
  currencyCode?: string;
  matchingAmount?: number;
  matchingLocalAmount?: number;
  tdsAmount?: number;
}

// =====================
// PAYMENT PDF DATA
// =====================
export interface PaymentPdfData extends PdfDocumentBase {
  printSettings?: {
    logoPosition: 'left' | 'center' | 'right';
    companyPosition: 'left' | 'center' | 'right';
    companyAlignment: 'left' | 'center' | 'right';
  };
  paymentType: 'bank' | 'cash';
  payment: {
    voucherNumber?: string;
    voucherDate?: Date | string;
    paidTo?: string;
    paidFrom?: string;
    currencyCode?: string;
    exchangeRate?: number;
    bankName?: string;
    instrumentMode?: string;
    instrumentNumber?: string;
    instrumentDate?: Date | string;
  };
  details: PaymentLineData[];
  voucherMatchings?: PaymentMatchingData[];
  totals: {
    totalAmount: number;
    totalMatchingAmount: number;
    totalMatchingLocalAmount: number;
  };
  amountInWords?: string;
}

export interface PaymentLineData {
  ledgerName?: string;
  narration?: string;
  currencyCode?: string;
  exchangeRate?: number;
  amount?: number;
  partyAmount?: number;
}

export interface PaymentMatchingData {
  voucherNumber?: string;
  voucherType?: string;
  voucherDate?: Date | string;
  currencyCode?: string;
  exchangeRate?: number;
  matchingAmount?: number;
  matchingLocalAmount?: number;
  BillNo?: string;
  BillDate?: Date | string;
}


// =====================
// DOCUMENT TYPE ENUMS
// =====================
export type BookingDocumentType = 'booking' | 'cro';
export type MasterJobDocumentType = 'mbl' | 'manifest' | 'jobCard' | 'packingList';
export type QuotationDocumentType = 'quotation' | 'contract';
