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
  containerTypeList?: any[];
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
// SHIPMENT REPORT PDF DATA
// =====================
export interface ShipmentReportPdfData extends PdfDocumentBase {
  reportTitle: string;
  shipmentNo?: string;
  selectedFclLcl?: string;
  parties: {
    customerName?: string;
    customerAddress?: string;
    shipperName?: string;
    shipperAddress?: string;
    consigneeName?: string;
    consigneeAddress?: string;
    notifyName?: string;
    notifyAddress?: string;
  };
  shipmentInfo: {
    shipmentNo?: string;
    mblNo?: string;
    hblNo?: string;
    jobNo?: string;
    placeOfReceipt?: string;
    portOfLoading?: string;
    portOfReceipt?: string;
    portOfDischarge?: string;
    finalDestination?: string;
    placeOfDelivery?: string;
    etd?: Date | string;
    eta?: Date | string;
    carrier?: string;
    shipmentTerms?: string;
    vesselName?: string;
    voyageNo?: string;
    freightTerms?: string;
  };
  products: ShipmentProductPdfRow[];
  productTotals: {
    totalPackages: number;
    totalGrossWeight: number;
    totalNetWeight: number;
    totalVolume: number;
  };
  charges: ShipmentChargePdfRow[];
  chargeTotals: {
    totalPCurrRevenue: number;
    totalPCurrExpense: number;
    totalPCurrGP: number;
    totalLocalRevenue: number;
    totalLocalExpense: number;
    totalLocalGP: number;
  };
  revenueSummary: ShipmentPartyAmountRow[];
  expenseSummary: ShipmentPartyAmountRow[];
  summaryTotals: {
    totalRevenue: number;
    totalExpense: number;
  };
}

export interface ShipmentProductPdfRow {
  containerNo?: string;
  containerType?: string;
  commodity?: string;
  noOfPackage?: number;
  grossWeight?: number;
  netWeight?: number;
  volume?: number;
}

export interface ShipmentChargePdfRow {
  chargeName?: string;
  pCurrRevenue?: number;
  pCurrExpense?: number;
  pCurrGP?: number;
  localRevenue?: number;
  localExpense?: number;
  localGP?: number;
}

export interface ShipmentPartyAmountRow {
  customerName?: string;
  amount?: number;
}

// =====================
// JOB CARD PDF DATA
// =====================
export interface JobCardPdfData extends PdfDocumentBase {
  reportTitle: string;
  selectedDepartmentType?: string;
  parties: {
    clientName?: string;
    clientAddress?: string;
    shipperName?: string;
    shipperAddress?: string;
    consigneeName?: string;
    consigneeAddress?: string;
    forwarderName?: string;
    forwarderAddress?: string;
  };
  jobInfo: {
    jobNo?: string;
    houseNo?: string;
    masterNo?: string;
    pol?: string;
    pod?: string;
    fpd?: string;
    serviceType?: string;
    salesPerson?: string;
    placeOfReceipt?: string;
    placeOfDelivery?: string;
    eta?: Date | string;
    etd?: Date | string;
    vesselOrFlight?: string;
    carrier?: string;
    freightTerms?: string;
  };
  products: JobCardProductPdfRow[];
  productTotals: {
    totalLength: number;
    totalWidth: number;
    totalHeight: number;
    totalVolumetric: number;
    totalPackages: number;
    totalGrossWeight: number;
    totalVolume: number;
    totalNetWeight: number;
  };
  profitSummary: JobCardProfitPdfRow[];
  profitTotals: {
    totalSales: number;
    totalCost: number;
    profit: number;
  };
  costRevenueCharges: JobCardChargePdfRow[];
  revenueByParty: JobCardPartyAmountRow[];
  expenseByParty: JobCardPartyAmountRow[];
  internalRemarks?: string;
}

export interface JobCardProductPdfRow {
  commodity?: string;
  containerNo?: string;
  containerType?: string;
  length?: number;
  width?: number;
  height?: number;
  volumetric?: number;
  noOfPackage?: number;
  grossWeight?: number;
  volume?: number;
  netWeight?: number;
}

export interface JobCardProfitPdfRow {
  chargeName?: string;
  totalSales?: number;
  totalCost?: number;
  profit?: number;
}

export interface JobCardChargePdfRow {
  chargeName?: string;
  unit?: string;
  revenueCurrency?: string;
  revenueExchangeRate?: number;
  revenueRate?: number;
  revenueLocalAmount?: number;
  costCurrency?: string;
  costExchangeRate?: number;
  costRate?: number;
  costLocalAmount?: number;
}

export interface JobCardPartyAmountRow {
  party?: string;
  amount?: number;
}

// =====================
// MASTER JOB CARD PDF DATA
// =====================
export interface MasterJobCardPdfData extends PdfDocumentBase {
  reportTitle: string;
  selectedFclLcl?: string;
  parties: {
    clientName?: string;
    clientAddress?: string;
    shipperName?: string;
    shipperAddress?: string;
    consigneeName?: string;
    consigneeAddress?: string;
    forwarderName?: string;
    forwarderAddress?: string;
  };
  jobInfo: {
    jobNo?: string;
    houseNo?: string;
    masterNo?: string;
    pol?: string;
    pod?: string;
    fpd?: string;
    serviceType?: string;
    salesPerson?: string;
    placeOfReceipt?: string;
    placeOfDelivery?: string;
    eta?: Date | string;
    etd?: Date | string;
    vesselOrVoyage?: string;
    carrier?: string;
    freightTerms?: string;
  };
  containers: MasterJobCardContainerRow[];
  containerTotals: {
    totalPackages: number;
    totalGrossWeight: number;
    totalVolume: number;
    totalNetWeight: number;
  };
  profitSummary: MasterJobCardProfitRow[];
  profitTotals: {
    totalSales: number;
    totalCost: number;
    profit: number;
  };
  chargeRows: MasterJobCardChargeRow[];
  chargeTotals: {
    totalRevenueRate: number;
    totalRevenueLocalAmount: number;
    totalCostRate: number;
    totalCostLocalAmount: number;
  };
  revenueByParty: MasterJobCardPartyAmountRow[];
  expenseByParty: MasterJobCardPartyAmountRow[];
  internalRemarks?: string;
}

export interface MasterJobCardContainerRow {
  containerNo?: string;
  containerType?: string;
  commodityDescription?: string;
  noOfPackage?: number;
  grossWeight?: number;
  volume?: number;
  netWeight?: number;
}

export interface MasterJobCardProfitRow {
  chargeName?: string;
  totalSales?: number;
  totalCost?: number;
  profit?: number;
}

export interface MasterJobCardChargeRow {
  screen?: string;
  chargeName?: string;
  unit?: string;
  revenueCurrency?: string;
  revenueExchangeRate?: number;
  revenueRate?: number;
  revenueLocalAmount?: number;
  costCurrency?: string;
  costExchangeRate?: number;
  costRate?: number;
  costLocalAmount?: number;
}

export interface MasterJobCardPartyAmountRow {
  screen?: string;
  party?: string;
  amount?: number;
}

// =====================
// CARGO ARRIVAL PDF DATA
// =====================
export interface CargoArrivalPdfData extends PdfDocumentBase {
  reportTitle: string;
  withOrWithoutCharge: boolean;
  selectedFclLcl?: string;
  customerBlock?: string;
  referenceInfo: {
    hblNo?: string;
    hblDate?: Date | string;
    bookingNo?: string;
  };
  parties: {
    shipperName?: string;
    shipperAddress?: string;
    consigneeName?: string;
    consigneeAddress?: string;
    notifyName?: string;
    notifyAddress?: string;
    goodsAvailableAt?: string;
  };
  releaseInfo: {
    releaseType?: string;
    clearedBy?: string;
    oceanBillOfLading?: string;
    goodsDescription?: string;
    commodity?: string;
    orderReference?: string;
    finalDestination?: string;
    marksAndNumber?: string;
  };
  routingInfo: {
    mode?: string;
    vessel?: string;
    voyage?: string;
    finalDestination?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    etd?: Date | string;
    eta?: Date | string;
  };
  fclContainers: CargoArrivalContainerPdfRow[];
  lclSummary: {
    noOfPackages?: number;
    grossWeight?: number;
    netWeight?: number;
    volume?: number;
  };
  charges: CargoArrivalChargePdfRow[];
  chargeTotals: {
    totalPerUnit: number;
    totalAmount: number;
    totalLocalAmount: number;
  };
  amountInWords?: string;
  signatoryName?: string;
}

export interface CargoArrivalContainerPdfRow {
  containerNo?: string;
  containerType?: string;
  seal?: string;
  packageType?: string;
  grossWeight?: number;
  volume?: number;
}

export interface CargoArrivalChargePdfRow {
  chargeDescription?: string;
  unit?: string;
  currency?: string;
  exchangeRate?: number;
  perUnit?: number;
  amount?: number;
  localAmount?: number;
}

// =====================
// EXIT FORM PDF DATA
// =====================
export interface ExitFormPdfData extends PdfDocumentBase {
  reportTitle: string;
  exporterName?: string;
  hblNo?: string;
  hblDate?: Date | string;
  countryOfOrigin?: string;
  pointOfExit?: string;
  destination?: string;
  quantities: string[];
  commodityDescription?: string;
  totalQuantity?: string;
  totalWeight?: string;
  containerNumbers?: string;
  customsSealNumbers?: string;
}

// =====================
// DELIVERY ORDER PDF DATA
// =====================
export interface DeliveryOrderPdfData extends PdfDocumentBase {
  reportTitle: string;
  selectedFclLcl?: string;
  amountInWords?: string;
  releaseTo?: {
    name?: string;
    address?: string;
  };
  referenceInfo: {
    hblNo?: string;
    doNumber?: string;
    doDate?: Date | string;
    shipmentNo?: string;
  };
  parties: {
    shipperName?: string;
    shipperAddress?: string;
    consigneeName?: string;
    consigneeAddress?: string;
    notifyName?: string;
    notifyAddress?: string;
    goodsAvailableAt?: string;
  };
  releaseInfo: {
    releaseType?: string;
    orderReference?: string;
    oceanBillOfLading?: string;
    commodity?: string;
  };
  fclContainers: DeliveryOrderContainerPdfRow[];
  lclSummary: {
    noOfPackages?: number;
    grossWeight?: number;
    netWeight?: number;
    volume?: number;
  };
  descriptionInfo: {
    marksAndNumber?: string;
    goodsDescription?: string;
  };
  charges: DeliveryOrderChargePdfRow[];
  chargeTotals: {
    totalPerUnit: number;
    totalAmount: number;
    totalLocalAmount: number;
  };
  terms: string[];
}

export interface DeliveryOrderContainerPdfRow {
  containerNo?: string;
  containerType?: string;
  seal?: string;
  packageType?: string;
  grossWeight?: number;
  volume?: number;
}

export interface DeliveryOrderChargePdfRow {
  chargeDescription?: string;
  unit?: string;
  currency?: string;
  perUnit?: number;
  amount?: number;
  localAmount?: number;
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
// VENDOR INVOICE PDF DATA
// =====================
export interface VendorInvoicePdfData extends InvoicePdfData {}
export interface VendorCreditNotePdfData extends InvoicePdfData {}



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
// PAYMENT REQUEST PDF DATA
// =====================
export interface PaymentRequestPdfData extends PdfDocumentBase {
  printSettings?: {
    logoPosition: 'left' | 'center' | 'right';
    companyPosition: 'left' | 'center' | 'right';
    companyAlignment: 'left' | 'center' | 'right';
  };
  paymentRequest: {
    requestNumber?: string;
    requestDate?: Date | string;
    cashBank?: string;
    currencyCode?: string;
    partyName?: string;
    status?: string;
    payableTo?: string;
    bookingNo?: string;
    departmentName?: string;
    jobOrHouseNo?: string;
    remarks?: string;
  };
  details: PaymentRequestLineData[];
  totals: {
    totalAmount: number;
    totalLocalAmount: number;
  };
  amountInWords?: string;
}

export interface PaymentRequestLineData {
  chargeName?: string;
  unitName?: string;
  noOfUnit?: number;
  currencyCode?: string;
  exchangeRate?: number;
  perUnit?: number;
  amount?: number;
  localAmount?: number;
  partyName?: string;
}

// =====================
// JOURNAL VOUCHER PDF DATA
// =====================
export interface JournalVoucherPdfData extends PdfDocumentBase {
  printSettings?: {
    logoPosition: 'left' | 'center' | 'right';
    companyPosition: 'left' | 'center' | 'right';
    companyAlignment: 'left' | 'center' | 'right';
  };
  journalVoucher: {
    narration?: string;
    voucherNumber?: string;
    voucherDate?: Date | string;
    postDate?: Date | string;
    postStatus?: string;
  };
  details: JournalVoucherLineData[];
  totals: {
    totalDebit: number;
    totalCredit: number;
    difference: number;
  };
  amountInWords?: string;
}

export interface JournalVoucherLineData {
  ledgerName?: string;
  subledgerName?: string;
  currencyCode?: string;
  exchangeRate?: number;
  amount?: number;
  localAmount?: number;
  drCr?: string;
  narration?: string;
}

// =====================
// RELEASE LETTER PDF DATA
// =====================
export interface ReleaseLetterPdfData extends PdfDocumentBase {
  reportTitle: string;
  selectedFclLcl?: string;
  releaseInfo: {
    cfs?: string;
    attention?: string;
    shipper?: string;
    vessel?: string;
    voyage?: string;
    date?: Date | string;
    customerBookingRef?: string;
    bookingRef?: string;
    portOfDischarge?: string;
    finalDestination?: string;
  };
  fclCargo: ReleaseLetterFclCargoRow[];
  lclCargo: ReleaseLetterLclCargoRow[];
  releaseTo?: string;
  marksAndNumber?: string;
  remarks?: string;
  signatureCompanyName?: string;
}

export interface ReleaseLetterFclCargoRow {
  cargoType?: string;
  containerCount?: number;
  containerType?: string;
  noOfPackages?: number;
  grossWeight?: number;
  volume?: number;
}

export interface ReleaseLetterLclCargoRow {
  cargoType?: string;
  noOfPackages?: number;
  grossWeight?: number;
  volume?: number;
}

// =====================
// INDEMNITY PDF DATA
// =====================
export interface ImdemintyPdfData extends PdfDocumentBase {
  containerList: string[];
  houseJob: {
    vesselName?: string;
    eta?: Date | string;
    voyageNo?: string;
    hblDate?: Date | string;
    hblNo?: string;
    marksAndNumbers?: string;
    goodsDescription?: string;
  };
}


// =====================
// DOCUMENT TYPE ENUMS
// =====================
export type BookingDocumentType = 'booking' | 'cro';
export type MasterJobDocumentType = 'mbl' | 'manifest' | 'jobCard' | 'packingList';
export type QuotationDocumentType = 'quotation' | 'contract';
